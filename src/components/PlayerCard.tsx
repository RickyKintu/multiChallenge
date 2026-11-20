import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AVATAR_EMOJI } from '@/types/game';
import type { AvatarId } from '@/types/game';
import { Palette, FontSize, Radius, Spacing } from '@/constants/theme';

interface Props {
  avatar: AvatarId;
  username: string;
  score?: number;
  streak?: number;
  isReady?: boolean;
  isConnected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  highlight?: boolean;
}

export function PlayerCard({
  avatar, username, score, streak, isReady, isConnected = true,
  size = 'md', style, highlight,
}: Props) {
  const emojiSize = { sm: 28, md: 40, lg: 56 }[size];
  const nameSize = { sm: FontSize.xs, md: FontSize.sm, lg: FontSize.base }[size];

  return (
    <View style={[
      styles.card,
      highlight && styles.highlighted,
      !isConnected && styles.disconnected,
      style,
    ]}>
      <Text style={{ fontSize: emojiSize }}>{AVATAR_EMOJI[avatar]}</Text>

      <View style={styles.info}>
        <Text style={[styles.name, { fontSize: nameSize }]} numberOfLines={1}>
          {username}
        </Text>

        {score !== undefined && (
          <Text style={styles.score}>{score} pts</Text>
        )}

        {streak !== undefined && streak >= 2 && (
          <Text style={styles.streak}>🔥 ×{streak}</Text>
        )}
      </View>

      {isReady !== undefined && (
        <View style={[styles.readyDot, isReady ? styles.readyOn : styles.readyOff]} />
      )}

      {!isConnected && <Text style={styles.disconnectBadge}>📡</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.bg2,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  highlighted: {
    borderWidth: 1.5,
    borderColor: Palette.neonBlue,
  },
  disconnected: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
  },
  name: {
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  score: {
    color: Palette.neonBlue,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  streak: {
    fontSize: FontSize.xs,
    color: Palette.neonYellow,
  },
  readyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  readyOn:  { backgroundColor: Palette.neonGreen },
  readyOff: { backgroundColor: Palette.textMuted },
  disconnectBadge: {
    fontSize: 14,
  },
});
