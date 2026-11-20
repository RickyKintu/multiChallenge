/**
 * Memory Meltdown — memorize a sequence, reproduce it.
 * Sequence grows with each level. Fastest accurate player wins.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase';
import { updateMinigameState } from '@/lib/roomManager';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import type { MinigameProps } from '@/app/game';

const SYMBOLS  = ['🌟', '🔥', '💎', '⚡', '🎯', '🌊', '🍄', '👾'];
const SEQ_LEN  = 6;

function generateSequence(seed: number, len: number): number[] {
  let s = seed;
  const rand = (max: number) => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) % max; };
  return Array.from({ length: len }, () => rand(SYMBOLS.length));
}

type Phase = 'countdown' | 'show' | 'input' | 'done' | 'waiting';

export function MemoryMeltdown({ room, players, playerId, isHost, onFinish }: MinigameProps) {
  const seed     = room.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const sequence = generateSequence(seed + (room.current_round ?? 0), SEQ_LEN);

  const [phase, setPhase]         = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [showIdx, setShowIdx]     = useState(0);
  const [inputSeq, setInputSeq]   = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [flashAnim]               = useState(() => new Animated.Value(1));

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setTimeout(() => { setPhase('show'); setShowIdx(0); }, 0);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Show sequence
  useEffect(() => {
    if (phase !== 'show') return;
    if (showIdx >= sequence.length) {
      setTimeout(() => { setPhase('input'); setStartTime(Date.now()); }, 600);
      return;
    }
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1.3, duration: 300, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setShowIdx((i) => i + 1), 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showIdx, sequence.length]);

  // Subscribe for host results
  useEffect(() => {
    if (!isHost) return;
    const ch = supabase
      .channel(`memory:${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const state = (payload.new as typeof room).minigame_state as Record<string, unknown> | null;
        if (!state) return;
        const scores = state.scores as Record<string, number> | undefined;
        if (scores && Object.keys(scores).length >= players.length) {
          const order = Object.entries(scores).sort(([, a], [, b]) => a - b).map(([pid]) => pid);
          onFinish(order);
          ch.unsubscribe();
        }
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [room.id, isHost, players.length, onFinish]);

  const handleTap = useCallback(async (idx: number) => {
    if (phase !== 'input') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...inputSeq, idx];
    setInputSeq(next);

    if (next[next.length - 1] !== sequence[next.length - 1]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setInputSeq([]);
      return;
    }

    if (next.length === sequence.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const elapsed = startTime ? Date.now() - startTime : 99999;
      setPhase('done');
      await updateMinigameState(room.id, { [`scores.${playerId}`]: elapsed });
    }
  }, [phase, inputSeq, sequence, startTime, room.id, playerId]);

  if (phase === 'countdown') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🧠</Text>
        <Text style={styles.bigTitle}>Memory Meltdown</Text>
        <Text style={styles.sub}>Watch the sequence, then reproduce it!</Text>
        <Text style={styles.countdown}>{countdown > 0 ? String(countdown) : 'GO!'}</Text>
      </View>
    );
  }

  if (phase === 'done' || phase === 'waiting') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>✅</Text>
        <Text style={styles.bigTitle}>Nailed it!</Text>
        <Text style={styles.sub}>Waiting for other players…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.phaseLabel}>
          {phase === 'show' ? '👀 Memorize this!' : `🧠 Reproduce it! (${inputSeq.length}/${sequence.length})`}
        </Text>

        <View style={styles.seqRow}>
          {sequence.map((si, i) => {
            const revealed = phase === 'show' && i <= showIdx;
            const inputted  = phase === 'input' && i < inputSeq.length;
            const correct   = inputted && inputSeq[i] === sequence[i];
            const isFlashing = i === showIdx && phase === 'show';
            return (
              <Animated.View
                key={i}
                style={[
                  styles.seqCell,
                  (revealed || inputted) && styles.seqCellActive,
                  correct && styles.seqCellCorrect,
                  isFlashing && { transform: [{ scale: flashAnim }] },
                ]}>
                <Text style={styles.seqEmoji}>
                  {revealed || inputted ? SYMBOLS[sequence[i]] : '?'}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {phase === 'input' && (
          <View style={styles.inputGrid}>
            {SYMBOLS.map((sym, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.symBtn, pressed && styles.symPressed]}
                onPress={() => handleTap(idx)}>
                <Text style={styles.symEmoji}>{sym}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg1 },
  safe:   { flex: 1, padding: Spacing.lg },
  center: { flex: 1, backgroundColor: Palette.bg1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },

  bigEmoji:  { fontSize: 72 },
  bigTitle:  { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Palette.textPrimary },
  sub:       { fontSize: FontSize.base, color: Palette.textSecondary, textAlign: 'center' },
  countdown: { fontSize: 96, fontWeight: FontWeight.black, color: Palette.neonPurple },

  phaseLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  seqRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  seqCell: {
    width: 48, height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Palette.bg3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.textMuted,
  },
  seqCellActive:  { borderColor: Palette.neonPurple },
  seqCellCorrect: { borderColor: Palette.neonGreen, backgroundColor: Palette.neonGreen + '22' },
  seqEmoji: { fontSize: FontSize.md },

  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  symBtn: {
    width: 72, height: 72,
    backgroundColor: Palette.bg2,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Palette.neonPurple,
  },
  symPressed: { opacity: 0.6, transform: [{ scale: 0.95 }] },
  symEmoji: { fontSize: 36 },
});
