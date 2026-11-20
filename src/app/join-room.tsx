import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { GameButton } from '@/components/GameButton';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { joinRoom } from '@/lib/roomManager';
import type { AvatarId } from '@/types/game';

export default function JoinRoomScreen() {
  const { playerId, username, avatar } =
    useLocalSearchParams<{ playerId: string; username: string; avatar: AvatarId }>();
  const [code, setCode]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const c = code.trim();
    if (c.length !== 4 || !/^\d{4}$/.test(c)) {
      Alert.alert('Invalid Code', 'Room code must be exactly 4 digits.');
      return;
    }
    setLoading(true);
    try {
      const { room } = await joinRoom({ code: c, playerId, username, avatar });
      router.replace({
        pathname: '/lobby' as never,
        params: { roomId: room.id, playerId, isHost: '0' },
      });
    } catch (e: unknown) {
      Alert.alert('Could not join', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}>
          <View style={styles.content}>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={styles.title}>Join a Game</Text>
            <Text style={styles.sub}>Enter the 4-digit room code from the host</Text>

            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor={Palette.textMuted}
              textAlign="center"
              autoFocus
              returnKeyType="join"
              onSubmitEditing={handleJoin}
            />

            <GameButton
              label="🔑  Join Room"
              onPress={handleJoin}
              loading={loading}
              disabled={code.length !== 4}
              style={styles.btn}
            />
            <GameButton
              label="← Back"
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg1 },
  safe:   { flex: 1 },
  kav:    { flex: 1 },
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
  },
  sub: {
    fontSize: FontSize.sm,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: Palette.bg3,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    color: Palette.textPrimary,
    fontSize: 48,
    fontWeight: FontWeight.black,
    letterSpacing: 16,
    alignSelf: 'stretch',
    borderWidth: 2,
    borderColor: Palette.neonBlue,
  },
  btn: { alignSelf: 'stretch' },
});
