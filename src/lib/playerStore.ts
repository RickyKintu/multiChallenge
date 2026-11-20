import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { AvatarId, Player } from '@/types/game';

const PLAYER_ID_KEY = '@mc_player_id';

/** Load or create a persistent player profile */
export async function getOrCreatePlayer(
  username: string,
  avatar: AvatarId,
): Promise<Player> {
  const existingId = await AsyncStorage.getItem(PLAYER_ID_KEY);

  if (existingId) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', existingId)
      .single();
    if (!error && data) return data as Player;
    // If lookup fails (e.g. row deleted), fall through to create a new one
    await AsyncStorage.removeItem(PLAYER_ID_KEY);
  }

  // Create new
  const { data, error } = await supabase
    .from('players')
    .insert({ username, avatar })
    .select()
    .single();

  if (error || !data) {
    // Surface the real Supabase error so it's debuggable
    const detail = error
      ? `${error.message} (code: ${error.code})`
      : 'No data returned';
    throw new Error(`Failed to create player profile: ${detail}`);
  }

  await AsyncStorage.setItem(PLAYER_ID_KEY, data.id);
  return data as Player;
}

/** Update username/avatar for a returning player */
export async function updatePlayerProfile(
  playerId: string,
  username: string,
  avatar: AvatarId,
): Promise<void> {
  await supabase.from('players').update({ username, avatar }).eq('id', playerId);
}

/** Get stored player id (may be null on first launch) */
export async function getStoredPlayerId(): Promise<string | null> {
  return AsyncStorage.getItem(PLAYER_ID_KEY);
}

/** Increment stats after a game */
export async function recordGameEnd(
  playerId: string,
  won: boolean,
  pointsEarned: number,
  streak: number,
): Promise<void> {
  const { data: player } = await supabase
    .from('players')
    .select('games_played, games_won, total_points, best_streak')
    .eq('id', playerId)
    .single();

  if (!player) return;

  await supabase.from('players').update({
    games_played: player.games_played + 1,
    games_won:    player.games_won + (won ? 1 : 0),
    total_points: player.total_points + pointsEarned,
    best_streak:  Math.max(player.best_streak, streak),
  }).eq('id', playerId);
}
