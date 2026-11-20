// ─── Shared game types ───────────────────────────────────────────────────────

export type AvatarId =
  | 'dragon' | 'fox' | 'bear' | 'cat' | 'robot'
  | 'alien' | 'ninja' | 'wizard' | 'pirate' | 'astronaut';

export interface Player {
  id: string;
  username: string;
  avatar: AvatarId;
  games_played: number;
  games_won: number;
  total_points: number;
  best_streak: number;
}

export type RoomStatus = 'lobby' | 'picking' | 'playing' | 'results' | 'finished';

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  current_round: number;
  card_picker_index: number;
  current_minigame: MinigameId | null;
  minigame_state: MinigameState | null;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  player_id: string;
  username: string;
  avatar: AvatarId;
  score: number;
  streak: number;
  is_ready: boolean;
  is_connected: boolean;
}

export type MinigameId =
  | 'math_quiz'
  | 'roulette'
  | 'reaction_royale'
  | 'memory_meltdown'
  | 'color_chaos';

// Generic minigame state — each minigame defines its own shape
export type MinigameState = Record<string, unknown>;

export interface PlacementResult {
  player_id: string;
  placement: number;       // 1-based
  points_earned: number;
  bonus_points: number;
  new_score: number;
  new_streak: number;
}

export interface RoundResult {
  id: string;
  room_id: string;
  round_number: number;
  minigame: MinigameId;
  results: PlacementResult[];
}

// ─── Avatar emoji map ────────────────────────────────────────────────────────

export const AVATAR_EMOJI: Record<AvatarId, string> = {
  dragon:    '🐉',
  fox:       '🦊',
  bear:      '🐻',
  cat:       '🐱',
  robot:     '🤖',
  alien:     '👽',
  ninja:     '🥷',
  wizard:    '🧙',
  pirate:    '🏴‍☠️',
  astronaut: '👨‍🚀',
};

export const AVATAR_IDS = Object.keys(AVATAR_EMOJI) as AvatarId[];
