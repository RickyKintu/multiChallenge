import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AVATAR_IDS, AVATAR_EMOJI } from '@/types/game';
import type { AvatarId } from '@/types/game';
import { Palette, Radius, Spacing, FontSize } from '@/constants/theme';

interface Props {
  selected: AvatarId;
  onSelect: (id: AvatarId) => void;
}

export function AvatarPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {AVATAR_IDS.map((id) => (
        <Pressable
          key={id}
          onPress={() => onSelect(id)}
          style={[styles.cell, id === selected && styles.selected]}>
          <Text style={styles.emoji}>{AVATAR_EMOJI[id]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Palette.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 2,
    borderColor: Palette.neonBlue,
    backgroundColor: Palette.bg2,
  },
  emoji: {
    fontSize: FontSize.xl,
  },
});
