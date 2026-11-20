import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { GameButton } from '@/components/GameButton';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { createRoom } from '@/lib/roomManager';
import type { AvatarId } from '@/types/game';

export default function CreateRoomScreen() {
  const { playerId, username, avatar } =
    useLocalSearchParams<{ playerId: string; username: string; avatar: AvatarId }>();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { room } = await createRoom({ hostId: playerId, username, avatar });
      router.replace({
        pathname: '/lobby' as never,
        params: { roomId: room.id, playerId, isHost: '1' },
      });
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Palette.neonBlue} size="large" />
        <Text style={styles.loadingText}>Creating your room…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={styles.title}>Host a Game</Text>
          <Text style={styles.sub}>
            Create a private room and share the code with up to 7 friends.
          </Text>

          <View style={styles.ruleCard}>
            <Text style={styles.ruleTitle}>How to Win</Text>
            <Text style={styles.rule}>• First to reach 30 points wins</Text>
            <Text style={styles.rule}>• 1st place +3pts, 2nd +2pts, 3rd +1pt</Text>
            <Text style={styles.rule}>• Win streak bonuses up to +2 bonus pts</Text>
            <Text style={styles.rule}>• Last place always gets 0 points</Text>
          </View>

          <GameButton
            label="🚀  Create Room"
            onPress={handleCreate}
            style={styles.btn}
          />
          <GameButton
            label="← Back"
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg1 },
  safe:   { flex: 1 },
  center: { flex: 1, backgroundColor: Palette.bg1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Palette.textSecondary, fontSize: FontSize.base },
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  emoji: { fontSize: 72 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontSize: FontSize.sm,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  ruleCard: {
    backgroundColor: Palette.bg2,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
    alignSelf: 'stretch',
  },
  ruleTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Palette.textPrimary,
    marginBottom: Spacing.xs,
  },
  rule: {
    fontSize: FontSize.sm,
    color: Palette.textSecondary,
  },
  btn: { alignSelf: 'stretch' },
});
