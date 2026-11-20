/**
 * Round results screen — animated leaderboard + commentary.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { GameButton } from '@/components/GameButton';
import { PlayerCard } from '@/components/PlayerCard';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { nextRound, getRoomPlayers } from '@/lib/roomManager';
import { getCommentary } from '@/lib/commentary';
import type { AvatarId, Room, RoomPlayer, RoundResult } from '@/types/game';

export default function ResultsScreen() {
  const { roomId, playerId, isHost } =
    useLocalSearchParams<{ roomId: string; playerId: string; isHost: string }>();
  const amHost = isHost === '1';

  const [room, setRoom]       = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [result, setResult]   = useState<RoundResult | null>(null);
  const [commentary, setCommentary] = useState('');
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const loadData = useCallback(async () => {
    const [{ data: r }, rps, { data: rr }] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      getRoomPlayers(roomId),
      supabase.from('round_results')
        .select('*')
        .eq('room_id', roomId)
        .order('round_number', { ascending: false })
        .limit(1)
        .single(),
    ]);
    if (r) setRoom(r as Room);
    if (rps) setPlayers(rps);
    if (rr) {
      const roundResult = rr as RoundResult;
      setResult(roundResult);

      const sorted = [...roundResult.results].sort((a, b) => a.placement - b.placement);
      const winner = rps.find((p) => p.player_id === sorted[0]?.player_id);
      const loser  = rps.find((p) => p.player_id === sorted[sorted.length - 1]?.player_id);

      if (winner) {
        const winnerStreak = sorted[0].new_streak;
        const msg = getCommentary({ type: 'winner', username: winner.username, streak: winnerStreak });
        const loserMsg = loser && loser.player_id !== winner.player_id
          ? '\n' + getCommentary({ type: 'loser', username: loser.username })
          : '';
        setCommentary(msg + loserMsg);
      }
    }
  }, [roomId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().then(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  const handleNext = async () => {
    if (!room || !amHost) return;
    const nextPicker = ((room.card_picker_index ?? 0) + 1) % players.length;
    await nextRound(roomId, nextPicker);
    router.replace({ pathname: '/game' as never, params: { roomId, playerId, isHost } });
  };

  if (!result || !room) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading results…</Text>
      </View>
    );
  }

  const sortedResults = [...result.results].sort((a, b) => a.placement - b.placement);

  const medalEmoji = (placement: number) => {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    return '';
  };

  const positionEmoji = (points: number) => (points > 0 ? `+${points}` : `${points}`);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <Text style={styles.roundLabel}>Round {result.round_number} Results</Text>

          {commentary.length > 0 && (
            <View style={styles.commentaryBox}>
              <Text style={styles.commentary}>{commentary}</Text>
            </View>
          )}

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {sortedResults.map((r) => {
              const p = players.find((pl) => pl.player_id === r.player_id);
              if (!p) return null;
              const totalGained = r.points_earned + r.bonus_points;
              return (
                <View key={r.player_id} style={[
                  styles.resultRow,
                  r.player_id === playerId && styles.myRow,
                ]}>
                  <Text style={styles.medal}>{medalEmoji(r.placement)}</Text>
                  <PlayerCard
                    avatar={p.avatar as AvatarId}
                    username={p.username}
                    score={r.new_score}
                    streak={r.new_streak}
                    size="sm"
                    style={styles.playerCard}
                  />
                  <View style={styles.pointsCol}>
                    <Text style={[
                      styles.pointsEarned,
                      totalGained > 0 ? styles.positive : totalGained < 0 ? styles.negative : styles.zero,
                    ]}>
                      {positionEmoji(totalGained)}
                    </Text>
                    {r.bonus_points > 0 && (
                      <Text style={styles.bonusTag}>🔥 +{r.bonus_points} bonus</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            {amHost ? (
              <GameButton label="▶  Next Round" onPress={handleNext} />
            ) : (
              <Text style={styles.waitingText}>Waiting for host to start next round…</Text>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg1 },
  safe:   { flex: 1, padding: Spacing.lg },
  center: { flex: 1, backgroundColor: Palette.bg1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Palette.textSecondary },

  roundLabel: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  commentaryBox: {
    backgroundColor: Palette.bg3,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  commentary: {
    fontSize: FontSize.sm,
    color: Palette.neonYellow,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: { flex: 1 },
  listContent: { gap: Spacing.sm },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.bg2,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  myRow: {
    borderWidth: 1.5,
    borderColor: Palette.neonBlue,
  },
  medal: { fontSize: 28, width: 36, textAlign: 'center' },
  playerCard: { flex: 1, backgroundColor: 'transparent' },
  pointsCol: { alignItems: 'flex-end', minWidth: 56 },
  pointsEarned: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  positive: { color: Palette.neonGreen },
  negative: { color: Palette.neonRed },
  zero:     { color: Palette.textMuted },
  bonusTag: { fontSize: FontSize.xs, color: Palette.neonYellow },
  footer:   { paddingTop: Spacing.md, gap: Spacing.sm },
  waitingText: { textAlign: 'center', color: Palette.textSecondary, fontSize: FontSize.sm },
});
