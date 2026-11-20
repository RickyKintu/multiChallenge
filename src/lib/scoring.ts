/**
 * Scoring engine — pure functions, no side effects.
 * Server-side logic is replicated here for display; the DB is the source of truth.
 */

import type { PlacementResult, RoomPlayer } from '@/types/game';

/** Points awarded by placement (1st → 3rd get points; everyone else gets 0) */
export function pointsForPlacement(placement: number): number {
  if (placement === 1) return 3;
  if (placement === 2) return 2;
  if (placement === 3) return 1;
  return 0;
}

/** Streak bonus on top of base points */
export function streakBonus(streak: number): number {
  if (streak >= 4) return 2;
  if (streak === 3) return 2;
  if (streak === 2) return 1;
  return 0;
}

/**
 * Calculate round results from raw finish order.
 * @param finishOrder  player_ids in finishing order (fastest/best first)
 * @param players      current room player records
 * @param isRoulette   if true, pointsEarned is passed in via roulettePoints
 * @param roulettePlayerId  only for roulette card
 * @param roulettePoints    only for roulette card
 */
export function calcRoundResults(params: {
  finishOrder: string[];
  players: RoomPlayer[];
  isRoulette?: boolean;
  roulettePlayerId?: string;
  roulettePoints?: number;
}): PlacementResult[] {
  const { finishOrder, players, isRoulette, roulettePlayerId, roulettePoints } = params;

  if (isRoulette && roulettePlayerId !== undefined && roulettePoints !== undefined) {
    return players.map((p) => {
      if (p.player_id === roulettePlayerId) {
        const newScore = Math.max(0, p.score + roulettePoints);
        return {
          player_id: p.player_id,
          placement: 1,
          points_earned: roulettePoints,
          bonus_points: 0,
          new_score: newScore,
          new_streak: p.streak, // roulette doesn't affect streak
        };
      }
      return {
        player_id: p.player_id,
        placement: 2,
        points_earned: 0,
        bonus_points: 0,
        new_score: p.score,
        new_streak: p.streak,
      };
    });
  }

  return finishOrder.map((pid, idx) => {
    const placement = idx + 1;
    const player = players.find((p) => p.player_id === pid)!;
    const base = pointsForPlacement(placement);
    const earns = base > 0;
    const newStreak = earns ? player.streak + 1 : 0;
    const bonus = earns ? streakBonus(newStreak) : 0;
    const newScore = player.score + base + bonus;

    return {
      player_id: pid,
      placement,
      points_earned: base,
      bonus_points: bonus,
      new_score: newScore,
      new_streak: newStreak,
    };
  });
}

/** Returns the player_id of whoever has reached or exceeded 30 points, or null */
export function checkWinner(results: PlacementResult[]): string | null {
  const winner = results.find((r) => r.new_score >= 30);
  return winner?.player_id ?? null;
}
