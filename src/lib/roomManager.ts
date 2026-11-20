import { supabase } from '@/lib/supabase';
import type { MinigameId, Room, RoomPlayer } from '@/types/game';

/** Generate a random 4-digit room code */
function randomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Create a new room and add the host as first player */
export async function createRoom(params: {
  hostId: string;
  username: string;
  avatar: string;
}): Promise<{ room: Room; roomPlayer: RoomPlayer }> {
  const { hostId, username, avatar } = params;

  // Try up to 5 times to get a unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .eq('status', 'lobby')
      .maybeSingle();

    if (existing) continue;

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({ code, host_id: hostId })
      .select()
      .single();

    if (roomErr || !room) throw new Error('Failed to create room');

    const { data: rp, error: rpErr } = await supabase
      .from('room_players')
      .insert({ room_id: room.id, player_id: hostId, username, avatar })
      .select()
      .single();

    if (rpErr || !rp) throw new Error('Failed to add host to room');

    return { room: room as Room, roomPlayer: rp as RoomPlayer };
  }

  throw new Error('Could not generate a unique room code. Please try again.');
}

/** Join an existing room by 4-digit code */
export async function joinRoom(params: {
  code: string;
  playerId: string;
  username: string;
  avatar: string;
}): Promise<{ room: Room; roomPlayer: RoomPlayer }> {
  const { code, playerId, username, avatar } = params;

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .eq('status', 'lobby')
    .maybeSingle();

  if (roomErr || !room) throw new Error('Room not found or game already started');

  // Check for duplicate username in room
  const { data: existing } = await supabase
    .from('room_players')
    .select('id, username')
    .eq('room_id', room.id);

  if (existing) {
    const taken = existing.some(
      (rp) =>
        rp.username.toLowerCase() === username.toLowerCase() &&
        // allow same player to rejoin
        (rp as RoomPlayer & { player_id: string }).player_id !== playerId,
    );
    if (taken) throw new Error('That username is already taken in this room');
  }

  // Upsert in case of reconnect
  const { data: rp, error: rpErr } = await supabase
    .from('room_players')
    .upsert(
      { room_id: room.id, player_id: playerId, username, avatar, is_connected: true },
      { onConflict: 'room_id,player_id' },
    )
    .select()
    .single();

  if (rpErr || !rp) throw new Error('Failed to join room');

  return { room: room as Room, roomPlayer: rp as RoomPlayer };
}

/** Mark a player as ready */
export async function setReady(roomPlayerId: string, ready: boolean): Promise<void> {
  await supabase.from('room_players').update({ is_ready: ready }).eq('id', roomPlayerId);
}

/** Host starts the game */
export async function startGame(roomId: string): Promise<void> {
  await supabase.from('rooms').update({ status: 'picking' }).eq('id', roomId);
}

/** Host advances to next minigame */
export async function setMinigame(
  roomId: string,
  minigame: MinigameId,
  initialState: Record<string, unknown>,
): Promise<void> {
  await supabase.from('rooms').update({
    status: 'playing',
    current_minigame: minigame,
    minigame_state: initialState,
    updated_at: new Date().toISOString(),
  }).eq('id', roomId);
}

/** Update live minigame state (e.g. player answers) */
export async function updateMinigameState(
  roomId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  // Fetch current state then merge
  const { data } = await supabase
    .from('rooms')
    .select('minigame_state')
    .eq('id', roomId)
    .single();
  const merged = { ...(data?.minigame_state ?? {}), ...patch };
  await supabase.from('rooms').update({
    minigame_state: merged,
    updated_at: new Date().toISOString(),
  }).eq('id', roomId);
}

/** Persist round results and update player scores */
export async function commitRoundResults(params: {
  roomId: string;
  roundNumber: number;
  minigame: MinigameId;
  results: {
    player_id: string;
    placement: number;
    points_earned: number;
    bonus_points: number;
    new_score: number;
    new_streak: number;
  }[];
  winnerId: string | null;
}): Promise<void> {
  const { roomId, roundNumber, minigame, results, winnerId } = params;

  // Insert round result record
  await supabase.from('round_results').insert({
    room_id: roomId,
    round_number: roundNumber,
    minigame,
    results,
  });

  // Update every player's score and streak
  for (const r of results) {
    await supabase.from('room_players').update({
      score: r.new_score,
      streak: r.new_streak,
    }).eq('room_id', roomId).eq('player_id', r.player_id);
  }

  // Advance room state
  const nextStatus = winnerId ? 'finished' : 'results';
  await supabase.from('rooms').update({
    status: nextStatus,
    current_round: roundNumber,
    updated_at: new Date().toISOString(),
  }).eq('id', roomId);
}

/** Advance room to card-picking phase for the next round */
export async function nextRound(roomId: string, nextPickerIndex: number): Promise<void> {
  await supabase.from('rooms').update({
    status: 'picking',
    card_picker_index: nextPickerIndex,
    current_minigame: null,
    minigame_state: null,
    updated_at: new Date().toISOString(),
  }).eq('id', roomId);
}

/** Mark player disconnected */
export async function setConnected(roomPlayerId: string, connected: boolean): Promise<void> {
  await supabase.from('room_players').update({ is_connected: connected }).eq('id', roomPlayerId);
}

/** Get all players in a room */
export async function getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
  const { data } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at');
  return (data ?? []) as RoomPlayer[];
}
