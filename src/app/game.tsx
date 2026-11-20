/**
 * Game orchestrator screen.
 * Handles: card picking → minigame → results → next round / victory
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { MathQuiz }       from '@/components/minigames/MathQuiz';
import { Roulette }       from '@/components/minigames/Roulette';
import { ReactionRoyale } from '@/components/minigames/ReactionRoyale';
import { MemoryMeltdown } from '@/components/minigames/MemoryMeltdown';
import { ColorChaos }     from '@/components/minigames/ColorChaos';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { setMinigame, getRoomPlayers, commitRoundResults } from '@/lib/roomManager';
import { calcRoundResults, checkWinner } from '@/lib/scoring';
import type { MinigameId, Room, RoomPlayer } from '@/types/game';

// ── Minigame card definitions ─────────────────────────────────────────────────
const MINIGAME_CARDS: { id: MinigameId; emoji: string; title: string; desc: string; color: string }[] = [
  { id: 'math_quiz',       emoji: '🧮', title: 'Math Quiz',       desc: 'Race to solve 5 equations',         color: Palette.neonBlue   },
  { id: 'roulette',        emoji: '🎰', title: 'Roulette',        desc: 'Spin the wheel — luck decides',      color: Palette.neonPink   },
  { id: 'reaction_royale', emoji: '⚡', title: 'Reaction Royale', desc: 'Tap the moment you see the signal',  color: Palette.neonYellow },
  { id: 'memory_meltdown', emoji: '🧠', title: 'Memory Meltdown', desc: 'Memorize and reproduce the sequence',color: Palette.neonPurple },
  { id: 'color_chaos',     emoji: '🎨', title: 'Color Chaos',     desc: 'Read the ink, not the word',         color: Palette.neonGreen  },
];

export interface MinigameProps {
  room: Room;
  players: RoomPlayer[];
  playerId: string;
  isHost: boolean;
  onFinish: (finishOrder: string[], rouletteData?: { playerId: string; points: number }) => void;
}

function renderMinigame(props: MinigameProps) {
  switch (props.room.current_minigame) {
    case 'math_quiz':       return <MathQuiz       {...props} />;
    case 'roulette':        return <Roulette        {...props} />;
    case 'reaction_royale': return <ReactionRoyale  {...props} />;
    case 'memory_meltdown': return <MemoryMeltdown  {...props} />;
    case 'color_chaos':     return <ColorChaos      {...props} />;
    default: return null;
  }
}

export default function GameScreen() {
  const { roomId, playerId, isHost } =
    useLocalSearchParams<{ roomId: string; playerId: string; isHost: string }>();
  const amHost = isHost === '1';

  const [room, setRoom]       = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [committing, setCommitting] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadAll = useCallback(async () => {
    const [{ data: r }, rps] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      getRoomPlayers(roomId),
    ]);
    if (r) setRoom(r as Room);
    setPlayers(rps);
  }, [roomId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const ch = supabase
      .channel(`game:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        () => { getRoomPlayers(roomId).then(setPlayers); },
      )
      .subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [roomId]);

  // Watch for status transitions
  useEffect(() => {
    if (!room) return;
    if (room.status === 'finished') {
      router.replace({ pathname: '/victory' as never, params: { roomId, playerId } });
    }
    if (room.status === 'results') {
      router.push({ pathname: '/results' as never, params: { roomId, playerId, isHost } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, roomId, playerId, isHost]);

  // ── Card picker ─────────────────────────────────────────────────────────────
  const pickerPlayer = players[room?.card_picker_index ?? 0];
  const amPicker     = pickerPlayer?.player_id === playerId;

  const handlePickCard = async (minigameId: MinigameId) => {
    if (!room) return;
    await setMinigame(roomId, minigameId, { phase: 'countdown', ready: {} });
  };

  // ── Minigame finish callback (host only commits) ─────────────────────────
  const handleFinish = useCallback(async (
    finishOrder: string[],
    rouletteData?: { playerId: string; points: number },
  ) => {
    if (!amHost || !room || committing) return;
    setCommitting(true);
    try {
      const results = calcRoundResults({
        finishOrder,
        players,
        isRoulette: !!rouletteData,
        roulettePlayerId: rouletteData?.playerId,
        roulettePoints:   rouletteData?.points,
      });
      const winnerId = checkWinner(results);
      await commitRoundResults({
        roomId,
        roundNumber: (room.current_round ?? 0) + 1,
        minigame: room.current_minigame!,
        results,
        winnerId,
      });
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
      setCommitting(false);
    }
  }, [amHost, room, players, roomId, committing]);

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading game…</Text>
      </View>
    );
  }

  // ── Card picking phase ───────────────────────────────────────────────────
  if (room.status === 'picking') {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.roundLabel}>Round {(room.current_round ?? 0) + 1}</Text>
          <Text style={styles.pickerTitle}>
            {amPicker
              ? '🎴  Your turn to pick!'
              : `⏳  ${pickerPlayer?.username ?? '…'} is picking…`}
          </Text>

          {amPicker && (
            <ScrollView contentContainerStyle={styles.cardGrid}>
              {MINIGAME_CARDS.map((card) => (
                <Pressable
                  key={card.id}
                  style={({ pressed }) => [styles.card, { borderColor: card.color }, pressed && styles.cardPressed]}
                  onPress={() => handlePickCard(card.id)}>
                  <Text style={styles.cardEmoji}>{card.emoji}</Text>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDesc}>{card.desc}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {!amPicker && (
            <View style={styles.waiting}>
              <Text style={styles.waitingText}>
                Waiting for {pickerPlayer?.username ?? '…'} to choose a card…
              </Text>
              {/* Leaderboard mini-view */}
              <View style={styles.scoreboard}>
                {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                  <View key={p.id} style={styles.scoreRow}>
                    <Text style={styles.scoreRank}>#{i + 1}</Text>
                    <Text style={styles.scoreName}>{p.username}</Text>
                    <Text style={styles.scorePoints}>{p.score} pts</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    );
  }

  // ── Playing phase ────────────────────────────────────────────────────────
  if (room.status === 'playing') {
    return renderMinigame({ room, players, playerId, isHost: amHost, onFinish: handleFinish }) ?? (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading minigame…</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.loadingText}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg1 },
  safe:   { flex: 1, padding: Spacing.lg },
  center: { flex: 1, backgroundColor: Palette.bg1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Palette.textSecondary, fontSize: FontSize.base },

  roundLabel: {
    fontSize: FontSize.sm,
    color: Palette.textMuted,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  pickerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  card: {
    width: '45%',
    backgroundColor: Palette.bg2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
  },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  cardEmoji: { fontSize: 40 },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: FontSize.xs,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  waitingText: { color: Palette.textSecondary, fontSize: FontSize.base, textAlign: 'center' },
  scoreboard: {
    backgroundColor: Palette.bg2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scoreRank: { width: 28, fontSize: FontSize.sm, color: Palette.textMuted, fontWeight: FontWeight.bold },
  scoreName: { flex: 1, fontSize: FontSize.base, color: Palette.textPrimary },
  scorePoints: { fontSize: FontSize.base, color: Palette.neonBlue, fontWeight: FontWeight.bold },
});
