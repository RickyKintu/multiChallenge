/**
 * Reaction Royale — wait for the signal, then tap as fast as possible.
 * 3 rounds per game. Tapping too early = penalty (+500ms).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase';
import { updateMinigameState } from '@/lib/roomManager';
import { Palette, FontSize, FontWeight, Spacing } from '@/constants/theme';
import type { MinigameProps } from '@/app/game';

const TOTAL_ROUNDS = 3;
const PENALTY_MS   = 500;
const MIN_WAIT     = 1500;
const MAX_WAIT     = 5000;

export function ReactionRoyale({ room, players, playerId, isHost, onFinish }: MinigameProps) {
  const [phase, setPhase]           = useState<'countdown' | 'waiting' | 'tap' | 'early' | 'done'>('countdown');
  const [countdown, setCountdown]   = useState(3);
  const [reactionRound, setReactionRound] = useState(0);
  const [myTimes, setMyTimes]       = useState<number[]>([]);
  const [signalTime, setSignalTime] = useState<number | null>(null);
  // Store Animated value in state so it's stable and readable in render
  const [bgColor]                   = useState(() => new Animated.Value(0));
  const signalTimeoutRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSignal = useCallback(() => {
    setSignalTime(Date.now());
    setPhase('tap');
    Animated.timing(bgColor, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [bgColor]);

  const scheduleSignal = useCallback(() => {
    if (!isHost) return;
    const delay = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
    signalTimeoutRef.current = setTimeout(async () => {
      await updateMinigameState(room.id, { signal: true });
      triggerSignal();
    }, delay);
  }, [isHost, room.id, triggerSignal]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setTimeout(() => { setPhase('waiting'); scheduleSignal(); }, 0);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, scheduleSignal]);

  // Subscribe to state changes
  useEffect(() => {
    const ch = supabase
      .channel(`reaction:${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const state = (payload.new as typeof room).minigame_state as Record<string, unknown> | null;
        if (!state) return;
        if (state.signal === true) {
          triggerSignal();
        }
        if (state.phase === 'finish') {
          const scores = state.scores as Record<string, number> | undefined;
          if (scores && isHost) {
            const order = Object.entries(scores)
              .sort(([, a], [, b]) => a - b)
              .map(([pid]) => pid);
            onFinish(order);
          }
        }
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, isHost]);

  const nextRoundOrFinish = useCallback(async (times: number[]) => {
    setPhase('waiting');
    Animated.timing(bgColor, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    if (times.length >= TOTAL_ROUNDS) {
      const total = times.reduce((s, t) => s + t, 0);
      setPhase('done');
      await updateMinigameState(room.id, { [`scores.${playerId}`]: total });

      if (isHost) {
        setTimeout(async () => {
          const { data } = await supabase.from('rooms').select('minigame_state').eq('id', room.id).single();
          const scores = (data?.minigame_state as Record<string, unknown> | null)?.scores as Record<string, number> | undefined;
          if (scores && Object.keys(scores).length >= players.length) {
            const order = Object.entries(scores).sort(([, a], [, b]) => a - b).map(([pid]) => pid);
            onFinish(order);
          }
        }, 2000);
      }
    } else {
      setReactionRound((r) => r + 1);
      scheduleSignal();
    }
  }, [bgColor, room.id, playerId, isHost, players.length, scheduleSignal, onFinish]);

  const handleTap = async () => {
    if (phase === 'waiting') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const times = [...myTimes, PENALTY_MS];
      setMyTimes(times);
      setPhase('early');
      setTimeout(() => nextRoundOrFinish(times), 1200);
      return;
    }
    if (phase !== 'tap' || signalTime === null) return;

    const ms = Date.now() - signalTime;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const times = [...myTimes, ms];
    setMyTimes(times);
    nextRoundOrFinish(times);
  };

  const bg = bgColor.interpolate({ inputRange: [0, 1], outputRange: [Palette.bg1, Palette.neonGreen + '44'] });

  if (phase === 'countdown') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>⚡</Text>
        <Text style={styles.bigTitle}>Reaction Royale</Text>
        <Text style={styles.sub}>Tap the moment the screen turns GREEN</Text>
        <Text style={styles.countdown}>{countdown > 0 ? String(countdown) : 'GO!'}</Text>
      </View>
    );
  }

  if (phase === 'done') {
    const avg = myTimes.length ? Math.round(myTimes.reduce((s, t) => s + t, 0) / myTimes.length) : 0;
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>✅</Text>
        <Text style={styles.bigTitle}>Done!</Text>
        <Text style={styles.sub}>Your average: {avg}ms</Text>
        <Text style={styles.sub2}>Waiting for other players…</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.roundLabel}>Round {reactionRound + 1} / {TOTAL_ROUNDS}</Text>
          {myTimes.length > 0 && (
            <Text style={styles.lastTime}>Last: {myTimes[myTimes.length - 1]}ms</Text>
          )}
        </View>

        <Pressable style={styles.tapArea} onPress={handleTap}>
          <Text style={styles.tapInstruction}>
            {phase === 'waiting' ? '⏳  Wait…' : phase === 'early' ? '❌ Too early! (+500ms penalty)' : '👆  TAP NOW!'}
          </Text>
          <Text style={styles.tapHint}>
            {phase === 'tap' ? 'TAP AS FAST AS YOU CAN!' : 'Wait for the screen to turn green'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  safe:   { flex: 1, padding: Spacing.lg },
  center: { flex: 1, backgroundColor: Palette.bg1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },

  bigEmoji:  { fontSize: 72 },
  bigTitle:  { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Palette.textPrimary },
  sub:       { fontSize: FontSize.base, color: Palette.textSecondary, textAlign: 'center' },
  sub2:      { fontSize: FontSize.sm, color: Palette.textMuted },
  countdown: { fontSize: 96, fontWeight: FontWeight.black, color: Palette.neonBlue },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  roundLabel: { fontSize: FontSize.base, color: Palette.textSecondary },
  lastTime:   { fontSize: FontSize.base, color: Palette.neonGreen },

  tapArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  tapInstruction: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  tapHint: {
    fontSize: FontSize.base,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
});
