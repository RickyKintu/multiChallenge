/**
 * Math Quiz minigame — race to solve 5 equations correctly.
 * All players receive the same questions (seeded from room state).
 * Host commits results.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { updateMinigameState } from '@/lib/roomManager';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import type { MinigameProps } from '@/app/game';

type Question = { question: string; answer: number; options: number[] };

function generateQuestions(seed: number): Question[] {
  let s = seed;
  const rand = (max: number) => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) % max; };
  const qs: Question[] = [];
  const ops = ['+', '-', '×'] as const;
  for (let i = 0; i < 5; i++) {
    const diff = i + 1;
    const a = rand(10 * diff) + 1;
    const b = rand(10 * diff) + 1;
    const op = ops[rand(3)];
    let answer: number;
    let question: string;
    if (op === '+') { answer = a + b; question = `${a} + ${b}`; }
    else if (op === '-') { answer = Math.max(a, b); question = `${Math.max(a, b)} - ${Math.min(a, b)}`; }
    else { answer = a * b; question = `${a} × ${b}`; }
    const wrongSet = new Set<number>();
    while (wrongSet.size < 3) {
      const w = answer + (rand(10) - 5);
      if (w !== answer && w > 0) wrongSet.add(w);
    }
    const options = [answer, ...Array.from(wrongSet)].sort(() => (rand(2) ? 1 : -1));
    qs.push({ question, answer, options });
  }
  return qs;
}

export function MathQuiz({ room, players, playerId, isHost, onFinish }: MinigameProps) {
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [current, setCurrent]       = useState(0);
  const [finished, setFinished]     = useState(false);
  const [countdown, setCountdown]   = useState(3);
  const [phase, setPhase]           = useState<'countdown' | 'playing' | 'waiting'>('countdown');
  const [timeLeft, setTimeLeft]     = useState(30);
  const [wrongFlash, setWrongFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seed = room.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // Generate questions when round changes
  const roundKey = seed + (room.current_round ?? 0);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setQuestions(generateQuestions(roundKey)); }, [roundKey]);

  const recordFinish = useCallback(async (time: number) => {
    await updateMinigameState(room.id, { [`finishes.${playerId}`]: time });
  }, [room.id, playerId]);

  const handleTimeUp = useCallback(() => {
    setFinished(true);
    setPhase('waiting');
    recordFinish(30);
  }, [recordFinish]);

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
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, handleTimeUp]);

  // Subscribe to minigame_state for host to detect all finishes
  useEffect(() => {
    if (!isHost) return;
    const ch = supabase
      .channel(`mathquiz:${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const state = (payload.new as typeof room).minigame_state as Record<string, unknown> | null;
        if (!state) return;
        const finishes = state.finishes as Record<string, number> | undefined;
        if (!finishes) return;
        const finishedIds = Object.keys(finishes);
        if (finishedIds.length === players.length) {
          const order = [...finishedIds].sort((a, b) => (finishes[a] ?? 99999) - (finishes[b] ?? 99999));
          onFinish(order);
          ch.unsubscribe();
        }
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [isHost, room.id, players.length, onFinish]);

  const handleAnswer = (option: number) => {
    if (finished || phase !== 'playing') return;
    const q = questions[current];
    if (!q) return;
    if (option === q.answer) {
      if (current + 1 >= questions.length) {
        clearInterval(timerRef.current!);
        setFinished(true);
        setPhase('waiting');
        recordFinish(30 - timeLeft);
      } else {
        setCurrent((c) => c + 1);
      }
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    }
  };

  const q = questions[current];

  if (phase === 'countdown') {
    return (
      <View style={styles.center}>
        <Text style={styles.countdownEmoji}>🧮</Text>
        <Text style={styles.countdownTitle}>Math Quiz</Text>
        <Text style={styles.subtitle}>Solve all 5 equations as fast as you can!</Text>
        <Text style={styles.countdown}>{countdown > 0 ? String(countdown) : 'GO!'}</Text>
      </View>
    );
  }

  if (phase === 'waiting') {
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>✅</Text>
        <Text style={styles.doneTitle}>Done!</Text>
        <Text style={styles.sub}>Waiting for other players…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, wrongFlash && styles.flashRed]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.progress}>{current + 1} / {questions.length}</Text>
          <View style={styles.timerBox}>
            <Text style={[styles.timer, timeLeft <= 10 && styles.timerUrgent]}>{timeLeft}s</Text>
          </View>
        </View>

        <View style={styles.questionBox}>
          {q && <Text style={styles.question}>{q.question} = ?</Text>}
        </View>

        <View style={styles.optionGrid}>
          {q?.options.map((opt) => (
            <Pressable
              key={opt}
              style={({ pressed }) => [styles.optionBtn, pressed && styles.optionPressed]}
              onPress={() => handleAnswer(opt)}>
              <Text style={styles.optionText}>{opt}</Text>
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

  countdownEmoji: { fontSize: 72 },
  countdownTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Palette.textPrimary },
  subtitle:       { fontSize: FontSize.base, color: Palette.textSecondary, textAlign: 'center' },
  countdown:      { fontSize: 96, fontWeight: FontWeight.black, color: Palette.neonBlue },
  doneEmoji:      { fontSize: 72 },
  doneTitle:      { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Palette.neonGreen },
  sub:            { fontSize: FontSize.base, color: Palette.textSecondary },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  progress: { fontSize: FontSize.base, color: Palette.textSecondary },
  timerBox: {
    backgroundColor: Palette.bg3,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  timer: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Palette.textPrimary },
  timerUrgent: { color: Palette.neonRed },

  questionBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  question: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  optionBtn: {
    width: '45%',
    backgroundColor: Palette.bg2,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.neonBlue,
  },
  optionPressed: { opacity: 0.6 },
  optionText:    { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Palette.textPrimary },
});
