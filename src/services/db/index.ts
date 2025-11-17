import { supabase } from '../auth/supabaseAuth';
import type { Trade } from '../../state/types';

type DbTrade = {
  id: number;
  user_id: string;
  asset: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  market: string;
  style: string | null;
  date: string;
  notes: string | null;
  stop_loss: number | null;
  take_profit: number | null;
  trailing_enabled: boolean | null;
  trailing_type: 'percent' | 'amount' | null;
  trailing_value: number | null;
  remaining_qty: number | null;
  closures: Array<{ id: number; qty: number; price: number; date: string }>; 
};

function mapDbToTrade(row: DbTrade): Trade {
  return {
    id: row.id,
    userId: row.user_id,
    market: row.market,
    symbol: row.asset,
    side: row.side,
    qty: row.qty,
    price: row.price,
    remainingQty: row.remaining_qty ?? undefined,
    stopLoss: row.stop_loss ?? undefined,
    takeProfit: row.take_profit ?? undefined,
    trailingEnabled: row.trailing_enabled ?? undefined,
    trailingType: row.trailing_type ?? undefined as any,
    trailingValue: row.trailing_value ?? undefined,
    date: row.date,
    note: row.notes ?? undefined,
    closures: Array.isArray(row.closures) ? row.closures : [],
  };
}

export async function fetchUserTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as DbTrade[]).map(mapDbToTrade);
}

export async function insertTrade(userId: string, trade: Omit<Trade, 'id' | 'userId'>): Promise<Trade | null> {
  const payload = {
    user_id: userId,
    asset: trade.symbol,
    side: trade.side,
    qty: trade.qty,
    price: trade.price,
    market: trade.market,
    style: (trade as any).style ?? '',
    date: trade.date,
    notes: trade.note ?? null,
    stop_loss: trade.stopLoss ?? null,
    take_profit: trade.takeProfit ?? null,
    trailing_enabled: trade.trailingEnabled ?? null,
    trailing_type: (trade.trailingType as any) ?? null,
    trailing_value: trade.trailingValue ?? null,
    remaining_qty: trade.remainingQty ?? trade.qty,
    closures: trade.closures ?? [],
  };
  const { data, error } = await supabase
    .from('trades')
    .insert([payload])
    .select('*')
    .single();
  if (error || !data) return null;
  return mapDbToTrade(data as unknown as DbTrade);
}

export async function deleteTradeById(id: number): Promise<boolean> {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  return !error;
}

// Finance: Emergency cushion transactions
type DbEmergencyTx = {
  id: number;
  user_id: string;
  date: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  currency: string;
  location: string | null;
  note: string | null;
};

export async function fetchEmergencyTx(userId: string) {
  const { data, error } = await supabase
    .from('finance_emergency_tx')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error || !data) return [] as DbEmergencyTx[];
  return data as unknown as DbEmergencyTx[];
}

export async function insertEmergencyTx(userId: string, tx: Omit<DbEmergencyTx, 'id' | 'user_id'>) {
  const payload = { ...tx, user_id: userId } as const;
  const { data, error } = await supabase
    .from('finance_emergency_tx')
    .insert([payload])
    .select('*')
    .single();
  if (error || !data) return null as DbEmergencyTx | null;
  return data as unknown as DbEmergencyTx;
}

export async function deleteEmergencyTxById(id: number): Promise<boolean> {
  const { error } = await supabase.from('finance_emergency_tx').delete().eq('id', id);
  return !error;
}

export async function updateEmergencyTxById(id: number, patch: Partial<Omit<DbEmergencyTx, 'id' | 'user_id'>>): Promise<boolean> {
  const { error } = await supabase
    .from('finance_emergency_tx')
    .update(patch as any)
    .eq('id', id);
  return !error;
}

// Finance: Investment transactions
type DbInvestTx = {
  id: number;
  user_id: string;
  date: string;
  type: 'in' | 'out';
  amount: number;
  currency: string;
  destination: string;
  note: string | null;
};

export async function fetchInvestTx(userId: string) {
  const { data, error } = await supabase
    .from('finance_invest_tx')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error || !data) return [] as DbInvestTx[];
  return data as unknown as DbInvestTx[];
}

export async function insertInvestTx(userId: string, tx: Omit<DbInvestTx, 'id' | 'user_id'>) {
  const payload = { ...tx, user_id: userId } as const;
  const { data, error } = await supabase
    .from('finance_invest_tx')
    .insert([payload])
    .select('*')
    .single();
  if (error || !data) return null as DbInvestTx | null;
  return data as unknown as DbInvestTx;
}

export async function deleteInvestTxById(id: number): Promise<boolean> {
  const { error } = await supabase.from('finance_invest_tx').delete().eq('id', id);
  return !error;
}

export async function updateInvestTxById(id: number, patch: Partial<Omit<DbInvestTx, 'id' | 'user_id'>>): Promise<boolean> {
  const { error } = await supabase
    .from('finance_invest_tx')
    .update(patch as any)
    .eq('id', id);
  return !error;
}

// Finance: Debts
type DbDebt = {
  id: number;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
};

export async function fetchDebts(userId: string) {
  const { data, error } = await supabase
    .from('finance_debts')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: true });
  if (error || !data) return [] as DbDebt[];
  return data as unknown as DbDebt[];
}

export async function insertDebt(userId: string, debt: Omit<DbDebt, 'id' | 'user_id'>) {
  const payload = { ...debt, user_id: userId } as const;
  const { data, error } = await supabase
    .from('finance_debts')
    .insert([payload])
    .select('*')
    .single();
  if (error || !data) return null as DbDebt | null;
  return data as unknown as DbDebt;
}

export async function deleteDebtById(id: number): Promise<boolean> {
  const { error } = await supabase.from('finance_debts').delete().eq('id', id);
  return !error;
}

export async function updateDebtAmount(id: number, amount: number): Promise<boolean> {
  const { error } = await supabase
    .from('finance_debts')
    .update({ amount })
    .eq('id', id);
  return !error;
}

// Planner: Workouts
type DbWorkout = {
  id: number;
  user_id: string;
  date: string;
  time: string | null;
  type: string;
  notes: string | null;
  remind_before: number;
};

export async function fetchWorkouts(userId: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error || !data) return [] as DbWorkout[];
  return data as unknown as DbWorkout[];
}

export async function insertWorkout(userId: string, w: Omit<DbWorkout, 'id' | 'user_id'>) {
  const payload = { ...w, user_id: userId } as const;
  const { data, error } = await supabase
    .from('workouts')
    .insert([payload])
    .select('*')
    .single();
  if (error || !data) return null as DbWorkout | null;
  return data as unknown as DbWorkout;
}

export async function deleteWorkoutById(id: number): Promise<boolean> {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  return !error;
}

// Planner: Events
type DbEvent = {
  id: number;
  user_id: string;
  date: string;
  time: string | null;
  title: string;
  notes: string | null;
  remind_before: number;
};

export async function fetchEvents(userId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error || !data) return [] as DbEvent[];
  return data as unknown as DbEvent[];
}

export async function insertEvent(userId: string, e: Omit<DbEvent, 'id' | 'user_id'>) {
  const payload = { ...e, user_id: userId } as const;
  const { data, error } = await supabase
    .from('events')
    .insert([payload])
    .select('*')
    .single();
  if (error || !data) return null as DbEvent | null;
  return data as unknown as DbEvent;
}

export async function deleteEventById(id: number): Promise<boolean> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  return !error;
}

// Community: Posts
type DbPost = {
  id: number;
  user_id: string;
  title: string;
  content: string;
  market: string;
  images: string[];
  likes: (string | number)[];
  comments: Array<{ id: number; userId: string | number; text: string; date: string }>;
  created_at: string;
};

export async function fetchPosts(userId: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [] as DbPost[];
  return data as unknown as DbPost[];
}

export async function insertPost(userId: string, p: Omit<DbPost, 'id' | 'user_id' | 'likes' | 'comments' | 'created_at'>) {
  const payload = { ...p, user_id: userId, likes: [], comments: [] } as const;
  const { data, error } = await supabase
    .from('posts')
    .insert([payload])
    .select('*')
    .single();
  if (error || !data) return null as DbPost | null;
  return data as unknown as DbPost;
}

export async function deletePostById(id: number): Promise<boolean> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  return !error;
}

export async function updatePostLikes(id: number, likes: (string | number)[]): Promise<boolean> {
  const { error } = await supabase.from('posts').update({ likes }).eq('id', id);
  return !error;
}

export async function updatePostComments(
  id: number,
  comments: Array<{ id: number; userId: string | number; text: string; date: string }>
): Promise<boolean> {
  const { error } = await supabase.from('posts').update({ comments }).eq('id', id);
  return !error;
}


