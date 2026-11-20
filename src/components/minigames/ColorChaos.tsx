/**
 * Color Chaos — a Stroop test.
 * Words are shown in a color. Sometimes they match, sometimes they contradict.
 * Players must tap the INK COLOR (not the word).
 * 8 questions, fastest accurate player wins.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase';
import { updateMinigameState } from '@/lib/roomManager';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import type { MinigameProps } from '@/app/game';

type ColorEntry = { name: string; hex: string };
const COLORS: ColorEntry[] = [
  { name: 'RED',    hex: '#EF4444' },
  { name: 'BLUE',   hex: '#3B82F6' },
  { name: 'GREEN',  hex: '#10B981' },
  { name: 'YELLOW', hex: '#F59E0B' },
  { name: 'PURPLE', hex: '#8B5CF6' },
  { name: 'PINK',   hex: '#EC4899' },
];

type Question = { word: ColorEntry; inkColor: ColorEntry };

function generateQuestions(seed: number): Question[] {
  let s = seed;
  const rand = (max: number) => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) % max; };
  return Array.from({ length: 8 }, () => {
    const word     = COLORS[rand(COLORS.length)];
    const mismatch = rand(2) === 1;
    let ink = word;
    if (mismatch) {
      let attempts = 0;
      do { ink = COLORS[rand(COLORS.length)]; attempts++; } while (ink.name === word.name && attempts < 10);
    }
    return { word, inkColor: ink };
  });
}

export function ColorChaos({ room, players, playerId, isHost, onFinish }: MinigameProps) {
  const seed      = room.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const questions = generateQuestions(seed + (room.current_round ?? 0));

  const [phase, setPhase]         = useState<'countdown' | 'playing' | 'done'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [current, setCurrent]     = useState(0);
  const [score, setScore]         = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [timeLeft, setTimeLeft]   = useState(25);
  const scoreRef                  = useRef(0);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordScore = useCallback(async (finalScore: number) => {
    setPhase('done');
    if (timerRef.current) clearInterval(timerRef.current);
    await updateMinigameState(room.id, { [`scores.${playerId}`]: finalScore });
  }, [room.id, playerId]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setTimeout(() => setPhase('playing'), 0);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          recordScore(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, recordScore]);

  // Subscribe for host results
  useEffect(() => {
    if (!isHost) return;
    const ch = supabase
      .channel(`colorchaos:${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const state = (payload.new as typeof room).minigame_state as Record<string, unknown> | null;
        if (!state) return;
        const scores = state.scores as Record<string, number> | undefined;
        if (scores && Object.keys(scores).length >= players.length) {
          const order = Object.entries(scores).sort(([, a], [, b]) => b - a).map(([pid]) => pid);
          onFinish(order);
          ch.unsubscribe();
        }
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [room.id, isHost, players.length, onFinish]);

  const handlePick = async (color: ColorEntry) => {
    if (phase !== 'playing') return;
    const q = questions[current];
    if (!q) return;

    if (color.name === q.inkColor.name) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      if (current + 1 >= questions.length) {
        setScore(nextScore);
        await recordScore(nextScore);
      } else {
        setScore(nextScore);
        setCurrent((c) => c + 1);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 400);
    }
  };

  const q = questions[current];

  if (phase === 'countdown') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🎨</Text>
        <Text style={styles.bigTitle}>Color Chaos</Text>
        <Text style={styles.sub}>Tap the INK COLOR — not the word!</Text>
        <Text style={styles.countdown}>{countdown > 0 ? String(countdown) : 'GO!'}</Text>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>✅</Text>
        <Text style={styles.bigTitle}>Done! Score: {score}</Text>
        <Text style={styles.sub}>Waiting for others…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, wrongFlash && styles.flashRed]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.progress}>{current + 1} / {questions.length}</Text>
          <Text style={styles.scoreDisplay}>✅ {score}</Text>
          <Text style={[styles.timer, timeLeft <= 8 && styles.timerUrgent]}>{timeLeft}s</Text>
        </View>

        {q && (
          <View style={styles.wordBox}>
            <Text style={[styles.word, { color: q.inkColor.hex }]}>{q.word.name}</Text>
            <Text style={styles.instruction}>What color is the INK?</Text>
          </View>
        )}

        <View style={styles.colorGrid}>
          {COLORS.map((c) => (
            <Pressable
              key={c.name}
              style={({ pressed }) => [styles.colorBtn, { backgroundColor: c.hex + '33', borderColor: c.hex }, pressed && styles.pressed]}
              onPress={() => handlePick(c)}>
              <Text style={[styles.colorLabel, { color: c.hex }]}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Palette.bg1 },
  flashRed: { backgroundColor: '#3D0000' },
  safe:     { flex: 1, padding: Spacing.lg },
  center:   { flex: 1, backgroundColor: Palette.bg1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },

  bigEmoji:  { fontSize: 72 },
  bigTitle:  { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Palette.textPrimary },
  sub:       { fontSize: FontSize.base, color: Palette.textSecondary, textAlign: 'center' },
  countdown: { fontSize: 96, fontWeight: FontWeight.black, color: Palette.neonGreen },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  progress: { fontSize: FontSize.base, color: Palette.textSecondary },
  scoreDisplay: { fontSize: FontSize.base, color: Palette.neonGreen, fontWeight: FontWeight.bold },
  timer: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Palette.textPrimary },
  timerUrgent: { color: Palette.neonRed },

  wordBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  word: {
    fontSize: 72,
    fontWeight: FontWeight.black,
    letterSpacing: 4,
  },
  instruction: { fontSize: FontSize.base, color: Palette.textSecondary },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  colorBtn: {
    width: '30%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  pressed: { opacity: 0.6 },
  colorLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
