import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Palette, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GameButton({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, style,
}: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bgColor = {
    primary:   Palette.neonBlue,
    secondary: Palette.bg3,
    danger:    Palette.neonRed,
    ghost:     'transparent',
  }[variant];

  const paddingV = { sm: Spacing.xs, md: Spacing.md, lg: Spacing.lg }[size];
  const fontSize: TextStyle['fontSize'] = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.md }[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bgColor, paddingVertical: paddingV },
        variant === 'secondary' && styles.border,
        variant === 'ghost' && styles.ghost,
        (pressed || disabled) && styles.pressed,
        style,
      ]}>
      {loading
        ? <ActivityIndicator color={Palette.textPrimary} />
        : <Text style={[styles.label, { fontSize }]}>{label}</Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  label: {
    color: Palette.textPrimary,
    fontWeight: FontWeight.bold,
  },
  border: {
    borderWidth: 1,
    borderColor: Palette.neonPurple,
  },
  ghost: {
    borderWidth: 1,
    borderColor: Palette.textMuted,
  },
  pressed: {
    opacity: 0.65,
  },
});
