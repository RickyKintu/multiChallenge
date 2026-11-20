/**
 * Roulette minigame — the card picker spins a wheel. Everyone else watches.
 * Server (host) generates the result and commits it.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameButton } from '@/components/GameButton';
import { supabase } from '@/lib/supabase';
import { updateMinigameState } from '@/lib/roomManager';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import type { MinigameProps } from '@/app/game';

const OUTCOMES = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
const SEGMENT_ANGLE = 360 / OUTCOMES.length;

function colorForValue(v: number): string {
  if (v > 0)  return Palette.neonGreen;
  if (v < 0)  return Palette.neonRed;
  return Palette.textMuted;
}

export function Roulette({ room, players, playerId, isHost, onFinish }: MinigameProps) {
  const pickerIndex = room.card_picker_index ?? 0;
  const picker      = players[pickerIndex];
  const amPicker    = picker?.player_id === playerId;

  const [phase, setPhase]   = useState<'intro' | 'spinning' | 'result'>('intro');
  const [result, setResult] = useState<number | null>(null);
  // Store animated value in state so it's stable across renders
  const [spinAnim]          = useState(() => new Animated.Value(0));

  const startSpin = useCallback((finalValue: number, onDone: () => void) => {
    const targetIndex = OUTCOMES.indexOf(finalValue);
    const targetDeg   = 360 * 5 + targetIndex * SEGMENT_ANGLE;
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue:  targetDeg,
      duration: 4000,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(onDone);
  }, [spinAnim]);

  // Subscribe to state for all players
  useEffect(() => {
    const ch = supabase
      .channel(`roulette:${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const state = (payload.new as typeof room).minigame_state as Record<string, unknown> | null;
        if (!state) return;
        if (state.phase === 'spinning') setPhase('spinning');
        if (state.phase === 'result' && state.value !== undefined) {
          const v = state.value as number;
          setResult(v);
          startSpin(v, () => setPhase('result'));
        }
        if (state.phase === 'finish' && state.value !== undefined) {
          const v = state.value as number;
          if (isHost) {
            onFinish(players.map((p) => p.player_id), { playerId: picker.player_id, points: v });
          }
        }
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, isHost, players.length]);

  const handleSpin = useCallback(async () => {
    if (!amPicker && !isHost) return;
    const value = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
    await updateMinigameState(room.id, { phase: 'spinning' });
    setPhase('spinning');
    setTimeout(async () => {
      await updateMinigameState(room.id, { phase: 'result', value });
      setResult(value);
      startSpin(value, async () => {
        setPhase('result');
        await updateMinigameState(room.id, { phase: 'finish', value });
      });
    }, 1000);
  }, [amPicker, isHost, room.id, startSpin]);

  const rotation = spinAnim.interpolate({
    inputRange:  [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>🎰 Roulette</Text>
        <Text style={styles.sub}>
          {amPicker ? "It's YOUR turn to spin!" : `${picker?.username ?? '…'} is spinning the wheel`}
        </Text>

        <View style={styles.wheelContainer}>
          <Animated.View style={[styles.wheel, { transform: [{ rotate: rotation }] }]}>
            {OUTCOMES.map((v, i) => (
              <View
                key={v}
                style={[
                  styles.segment,
                  {
                    transform: [{ rotate: `${i * SEGMENT_ANGLE}deg` }],
                    backgroundColor: colorForValue(v) + '33',
                  },
                ]}>
                <Text style={[styles.segmentText, { color: colorForValue(v) }]}>
                  {v > 0 ? `+${v}` : `${v}`}
                </Text>
              </View>
            ))}
          </Animated.View>
          <View style={styles.pointer} />
        </View>

        {phase === 'result' && result !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Result</Text>
            <Text style={[styles.resultValue, { color: colorForValue(result) }]}>
              {result > 0 ? `+${result}` : `${result}`}
            </Text>
            <Text style={styles.resultSub}>
              {result > 0
                ? `${picker?.username} gains ${result} point${result !== 1 ? 's' : ''}! 🎉`
                : result < 0
                ? `${picker?.username} loses ${Math.abs(result)} point${Math.abs(result) !== 1 ? 's' : ''}! 😬`
                : `${picker?.username} stays put. Phew.`}
            </Text>
          </View>
        )}

        {phase === 'intro' && (amPicker || isHost) && (
          <GameButton label="🎰  Spin!" onPress={handleSpin} style={styles.spinBtn} />
        )}

        {phase === 'spinning' && (
          <Text style={styles.spinningText}>Spinning…</Text>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg0 },
  safe:   { flex: 1, padding: Spacing.lg, alignItems: 'center' },
  title:  { fontSize: FontSize.xl,  fontWeight: FontWeight.black, color: Palette.textPrimary, marginBottom: Spacing.xs },
  sub:    { fontSize: FontSize.base, color: Palette.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },

  wheelContainer: {
    width: 240, height: 240,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  wheel: {
    width: 240, height: 240,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: Palette.neonBlue,
    backgroundColor: Palette.bg2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    width: '50%', height: 2,
    left: '50%',
    paddingLeft: Spacing.sm,
  },
  segmentText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  pointer: {
    position: 'absolute',
    top: 0,
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 20,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: Palette.neonYellow,
  },

  resultBox: {
    backgroundColor: Palette.bg2,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },
  resultLabel: { fontSize: FontSize.sm, color: Palette.textSecondary, letterSpacing: 2, textTransform: 'uppercase' },
  resultValue: { fontSize: 72, fontWeight: FontWeight.black },
  resultSub:   { fontSize: FontSize.base, color: Palette.textPrimary, textAlign: 'center' },

  spinBtn:      { alignSelf: 'stretch', marginTop: Spacing.md },
  spinningText: { fontSize: FontSize.lg, color: Palette.neonYellow, marginTop: Spacing.lg },
});
