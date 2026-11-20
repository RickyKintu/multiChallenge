/**
 * Lobby screen — real-time player list, ready system, host controls.
 * Subscribes to Supabase Realtime on rooms + room_players tables.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Share, Alert, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { PlayerCard } from '@/components/PlayerCard';
import { GameButton } from '@/components/GameButton';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { setReady, startGame, getRoomPlayers, setConnected } from '@/lib/roomManager';
import type { Room, RoomPlayer } from '@/types/game';

export default function LobbyScreen() {
  const { roomId, playerId, isHost } =
    useLocalSearchParams<{ roomId: string; playerId: string; isHost: string }>();

  const amHost = isHost === '1';

  const [room, setRoom]       = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [myRp, setMyRp]       = useState<RoomPlayer | null>(null);
  const [starting, setStarting] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // ── Load initial data ──────────────────────────────────────────────────────
  const loadRoom = useCallback(async () => {
    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (data) setRoom(data as Room);
  }, [roomId]);

  const loadPlayers = useCallback(async () => {
    const rps = await getRoomPlayers(roomId);
    setPlayers(rps);
    const me = rps.find((p) => p.player_id === playerId) ?? null;
    setMyRp(me);
  }, [roomId, playerId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadRoom(); void loadPlayers(); }, [loadRoom, loadPlayers]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel(`lobby:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        () => loadPlayers(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.status === 'picking') {
            router.replace({
              pathname: '/game' as never,
              params: { roomId, playerId, isHost },
            });
          }
        },
      )
      .subscribe();

    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, playerId, isHost]);

  // ── Handle app background (mark disconnected) ─────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!myRp) return;
      setConnected(myRp.id, state === 'active');
    });
    return () => sub.remove();
  }, [myRp]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleReady = async () => {
    if (!myRp) return;
    await setReady(myRp.id, !myRp.is_ready);
  };

  const handleStart = async () => {
    if (players.length < 1) {
      Alert.alert('Not enough players', 'You need at least 1 player to start.');
      return;
    }
    setStarting(true);
    try {
      await startGame(roomId);
    } catch {
      setStarting(false);
    }
  };

  const handleShare = () => {
    if (!room) return;
    Share.share({ message: `Join my MultiChallenge game! Room code: ${room.code}` });
  };

  const allReady = players.length > 0 && players.every((p) => p.is_ready);

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading lobby…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.codeLabel}>ROOM CODE</Text>
            <Text style={styles.code}>{room.code}</Text>
          </View>
          <GameButton label="Share 📤" onPress={handleShare} variant="secondary" size="sm" />
        </View>

        <Text style={styles.subtitle}>
          {players.length}/8 players  ·  {players.filter((p) => p.is_ready).length} ready
        </Text>

        {/* Player list */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {players.map((p) => (
            <PlayerCard
              key={p.id}
              avatar={p.avatar as import('@/types/game').AvatarId}
              username={p.username + (p.player_id === room.host_id ? ' 👑' : '')}
              isReady={p.is_ready}
              isConnected={p.is_connected}
              highlight={p.player_id === playerId}
            />
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Ready toggle for non-hosts (host auto-ready) */}
          {!amHost && (
            <GameButton
              label={myRp?.is_ready ? '✅  Ready!' : '👍  Mark Ready'}
              onPress={handleReady}
              variant={myRp?.is_ready ? 'secondary' : 'primary'}
            />
          )}

          {amHost && (
            <GameButton
              label={allReady ? '🚀  Start Game!' : `Waiting for players… (${players.filter(p=>p.is_ready).length}/${players.length})`}
              onPress={handleStart}
              loading={starting}
              disabled={!allReady && players.length < 2}
            />
          )}

          <Text style={styles.hint}>
            {amHost ? 'Start when everyone is ready' : 'Waiting for the host to start…'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg1 },
  safe:   { flex: 1, padding: Spacing.lg },
  center: { flex: 1, backgroundColor: Palette.bg1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Palette.textSecondary, fontSize: FontSize.base },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.bg2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  codeLabel: {
    fontSize: FontSize.xs,
    color: Palette.textMuted,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
  code: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Palette.neonBlue,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  list: { flex: 1 },
  listContent: { gap: Spacing.sm },
  footer: {
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  hint: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Palette.textMuted,
  },
});
