/**
 * MultiChallenge design system
 * Premium arcade aesthetic — deep backgrounds, vibrant neons, glassmorphism.
 */

import '@/global.css';

// ─── Palette ────────────────────────────────────────────────────────────────

export const Palette = {
  // Backgrounds
  bg0: '#0A0A14',       // deepest background
  bg1: '#10101E',       // screen background
  bg2: '#16162A',       // card / surface
  bg3: '#1E1E36',       // elevated surface / input

  // Accents
  neonBlue:   '#3B82F6',
  neonPurple: '#8B5CF6',
  neonPink:   '#EC4899',
  neonGreen:  '#10B981',
  neonYellow: '#F59E0B',
  neonRed:    '#EF4444',

  // Text
  textPrimary:   '#F0F0FF',
  textSecondary: '#8888AA',
  textMuted:     '#44445A',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

// ─── Gradients ───────────────────────────────────────────────────────────────

export const Gradients = {
  heroBg:    [Palette.bg0, '#0D0D22'],
  cardBlue:  [Palette.neonBlue,   '#1D4ED8'],
  cardPurple:[Palette.neonPurple, '#6D28D9'],
  cardPink:  [Palette.neonPink,   '#BE185D'],
  cardGreen: [Palette.neonGreen,  '#059669'],
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 16,
  md:   18,
  lg:   22,
  xl:   28,
  xxl:  36,
  hero: 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  black:   '900' as const,
};

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl:64,
} as const;

// ─── Radii ───────────────────────────────────────────────────────────────────

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;
