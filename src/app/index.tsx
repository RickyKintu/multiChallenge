import { StyleSheet, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Palette, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={styles.title}>MultiChallenge</Text>
          <Text style={styles.subtitle}>
            Up to 8 players · 15+ minigames · First to 30 wins
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
            onPress={() => router.push({ pathname: '/profile' as never, params: { mode: 'create' } })}>
            <Text style={styles.btnText}>🚀  Create Game</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}
            onPress={() => router.push({ pathname: '/profile' as never, params: { mode: 'join' } })}>
            <Text style={styles.btnText}>🔑  Join Game</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Gather your friends and start competing</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emoji: { fontSize: 72 },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: { gap: Spacing.md },
  btn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  btnPrimary:   { backgroundColor: Palette.neonBlue },
  btnSecondary: {
    backgroundColor: Palette.bg3,
    borderWidth: 1,
    borderColor: Palette.neonPurple,
  },
  btnPressed: { opacity: 0.75 },
  btnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Palette.textPrimary,
  },
  footer: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Palette.textMuted,
  },
});
