import { supabase, unwrap, unwrapList } from './supabase';
import { createLogger } from '../core/logger';

const log = createLogger('db:tags');

export interface Tag {
  id: number;
  guild_id: string;
  name: string;
  content: string;
  as_embed: boolean;
  uses: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getTag(guildId: string, name: string): Promise<Tag | null> {
  const { data } = await supabase
    .from('tags')
    .select('*')
    .eq('guild_id', guildId)
    .ilike('name', name)
    .single();

  return data ? (data as Tag) : null;
}

export async function createTag(
  tag: Omit<Tag, 'id' | 'uses' | 'created_at' | 'updated_at'>
): Promise<Tag | null> {
  return unwrap(
    await supabase.from('tags').insert(tag).select().single(),
    'createTag'
  ) as Tag | null;
}

export async function updateTag(
  guildId: string,
  name: string,
  patch: Partial<Tag>
): Promise<boolean> {
  const { error } = await supabase
    .from('tags')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('guild_id', guildId)
    .ilike('name', name);

  if (error) {
    log.error(`updateTag: ${error.message}`);
    return false;
  }
  return true;
}

export async function deleteTag(guildId: string, name: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('tags')
    .delete({ count: 'exact' })
    .eq('guild_id', guildId)
    .ilike('name', name);

  if (error) {
    log.error(`deleteTag: ${error.message}`);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function incrementTagUses(id: number): Promise<void> {
  const { data } = await supabase.from('tags').select('uses').eq('id', id).single();
  if (data) {
    await supabase.from('tags').update({ uses: Number(data.uses) + 1 }).eq('id', id);
  }
}

export async function listTags(guildId: string): Promise<Tag[]> {
  return unwrapList(
    await supabase
      .from('tags')
      .select('*')
      .eq('guild_id', guildId)
      .order('name', { ascending: true }),
    'listTags'
  ) as Tag[];
}
