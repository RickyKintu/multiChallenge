/**
 * Profile setup — shown before creating or joining a room.
 * Params: mode = 'create' | 'join'
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AvatarPicker } from '@/components/AvatarPicker';
import { GameButton } from '@/components/GameButton';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { getOrCreatePlayer } from '@/lib/playerStore';
import type { AvatarId } from '@/types/game';

const USERNAME_KEY = '@mc_username';
const AVATAR_KEY   = '@mc_avatar';

export default function ProfileScreen() {
  const { mode } = useLocalSearchParams<{ mode: 'create' | 'join' }>();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar]     = useState<AvatarId>('dragon');
  const [loading, setLoading]   = useState(false);

  // Restore saved username/avatar
  React.useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem(USERNAME_KEY);
      const a = await AsyncStorage.getItem(AVATAR_KEY) as AvatarId | null;
      if (u) setUsername(u);
      if (a) setAvatar(a);
    })();
  }, []);

  const handleContinue = async () => {
    const name = username.trim();
    if (name.length < 2 || name.length > 16) {
      Alert.alert('Invalid username', 'Username must be 2–16 characters.');
      return;
    }
    setLoading(true);
    try {
      await AsyncStorage.setItem(USERNAME_KEY, name);
      await AsyncStorage.setItem(AVATAR_KEY, avatar);
      const player = await getOrCreatePlayer(name, avatar);

      if (mode === 'create') {
        router.push({ pathname: '/create-room' as never, params: { playerId: player.id, username: name, avatar } });
      } else {
        router.push({ pathname: '/join-room' as never, params: { playerId: player.id, username: name, avatar } });
      }
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message ?? 'Something went wrong');
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
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Choose Your Character</Text>
            <Text style={styles.sub}>Pick an avatar and enter your name</Text>

            <AvatarPicker selected={avatar} onSelect={setAvatar} />

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter username…"
                placeholderTextColor={Palette.textMuted}
                value={username}
                onChangeText={setUsername}
                maxLength={16}
                autoCapitalize="none"
                returnKeyType="done"
              />
              <Text style={styles.charCount}>{username.length}/16</Text>
            </View>

            <GameButton
              label={mode === 'create' ? '🚀  Create Room' : '🔑  Continue to Join'}
              onPress={handleContinue}
              loading={loading}
              style={styles.cta}
            />

            <GameButton
              label="← Back"
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
              style={styles.back}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Palette.bg1 },
  safe:   { flex: 1 },
  kav:    { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, alignItems: 'stretch' },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontSize: FontSize.sm,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    backgroundColor: Palette.bg3,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Palette.textPrimary,
    fontSize: FontSize.base,
    borderWidth: 1,
    borderColor: Palette.bg3,
  },
  charCount: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.sm,
    fontSize: FontSize.xs,
    color: Palette.textMuted,
  },
  cta:  { marginTop: Spacing.sm },
  back: { marginTop: Spacing.xs },
});
