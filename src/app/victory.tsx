/**
 * Final victory screen — podium, final leaderboard, commentary, rematch.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { GameButton } from '@/components/GameButton';
import { PlayerCard } from '@/components/PlayerCard';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { getRoomPlayers } from '@/lib/roomManager';
import { getCommentary } from '@/lib/commentary';
import { recordGameEnd } from '@/lib/playerStore';
import type { AvatarId, RoomPlayer } from '@/types/game';

export default function VictoryScreen() {
  const { roomId, playerId } =
    useLocalSearchParams<{ roomId: string; playerId: string }>();

  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [commentary, setCommentary] = useState('');
  const [scaleAnim]   = useState(() => new Animated.Value(0));
  const [fadeAnim]    = useState(() => new Animated.Value(0));
  const statsRecordedRef = useRef(false);

  const loadData = useCallback(async () => {
    const rps = await getRoomPlayers(roomId);
    const sorted = [...rps].sort((a, b) => b.score - a.score);
    setPlayers(sorted);

    if (sorted.length > 0) {
      const winner = sorted[0];
      const loser  = sorted[sorted.length - 1];
      setCommentary(getCommentary({
        type: 'final_win',
        winner: winner.username,
        loser: loser.player_id !== winner.player_id ? loser.username : '...',
      }));

      if (!statsRecordedRef.current) {
        statsRecordedRef.current = true;
        const myEntry = sorted.find((p) => p.player_id === playerId);
        if (myEntry) {
          await recordGameEnd(
            playerId,
            winner.player_id === playerId,
            myEntry.score,
            myEntry.streak,
          );
        }
      }
    }
  }, [roomId, playerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().then(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  const winner = players[0];
  const podium = [players[1], players[0], players[2]].filter(Boolean);

  const podiumHeight = (pos: number) => [100, 150, 80][pos] ?? 80;
  const podiumLabel  = (pos: number) => ['🥈', '🥇', '🥉'][pos] ?? '';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <Text style={styles.title}>🏆 Game Over!</Text>

          {winner && (
            <Animated.View style={[styles.winnerBanner, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.winnerEmoji}>🎉</Text>
              <Text style={styles.winnerName}>{winner.username} wins!</Text>
              <Text style={styles.winnerScore}>{winner.score} points</Text>
            </Animated.View>
          )}

          <View style={styles.podium}>
            {podium.map((p, i) => (
              <View key={p.id} style={styles.podiumSlot}>
                <Text style={styles.podiumAvatar}>{podiumLabel(i)}</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{p.username}</Text>
                <View style={[styles.podiumBlock, { height: podiumHeight(i) }]} />
              </View>
            ))}
          </View>

          {commentary.length > 0 && (
            <View style={styles.commentaryBox}>
              <Text style={styles.commentary}>{commentary}</Text>
            </View>
          )}

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {players.map((p, i) => (
              <View key={p.id} style={styles.lbRow}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <PlayerCard
                  avatar={p.avatar as AvatarId}
                  username={p.username}
                  score={p.score}
                  size="sm"
                  style={styles.playerCard}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <GameButton
              label="🔁  Play Again"
              onPress={() => router.replace({ pathname: '/profile' as never, params: { mode: 'create' } })}
            />
            <GameButton
              label="🏠  Home"
              onPress={() => router.replace('/')}
              variant="ghost"
              size="sm"
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg0 },
  safe:   { flex: 1, padding: Spacing.lg },

  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  winnerBanner: {
    backgroundColor: Palette.bg2,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Palette.neonYellow,
    marginBottom: Spacing.md,
  },
  winnerEmoji: { fontSize: 48 },
  winnerName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Palette.neonYellow,
  },
  winnerScore: { fontSize: FontSize.base, color: Palette.textSecondary },

  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  podiumSlot:   { alignItems: 'center', flex: 1 },
  podiumAvatar: { fontSize: 28, marginBottom: Spacing.xs },
  podiumName:   { fontSize: FontSize.xs, color: Palette.textPrimary, marginBottom: Spacing.xs },
  podiumBlock:  { backgroundColor: Palette.bg3, width: '100%', borderRadius: Radius.sm },

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
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rank: { width: 28, fontSize: FontSize.base, color: Palette.textMuted, fontWeight: FontWeight.bold },
  playerCard: { flex: 1 },

  footer: { paddingTop: Spacing.md, gap: Spacing.sm },
});
