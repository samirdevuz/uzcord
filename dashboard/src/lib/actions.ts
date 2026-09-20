'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertGuildAccess } from './guard';
import { db } from './supabase';

/**
 * Barcha formalar oddiy HTML form sifatida yuboriladi — dashboard
 * to'liq server tomonda render qilinadi va JavaScript talab qilmaydi.
 * Natija `?status=ok|err&msg=...` orqali sahifaga qaytariladi.
 */

async function audit(
  guildId: string,
  actorId: string,
  actorTag: string,
  action: string,
  details: unknown
): Promise<void> {
  await db.from('dashboard_audit').insert({
    guild_id: guildId,
    actor_id: actorId,
    actor_tag: actorTag,
    action,
    details: details as never,
  });
}

function text(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === 'on';
}

function int(form: FormData, key: string, fallback: number, min: number, max: number): number {
  const raw = form.get(key);
  const parsed = Number.parseInt(typeof raw === 'string' ? raw : '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

/** Discord ID (snowflake) tekshiruvi — faqat raqam, 15-21 belgi. */
function snowflake(form: FormData, key: string): string | null {
  const value = text(form, key);
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 15 && digits.length <= 21 ? digits : null;
}

function back(path: string, ok: boolean, message: string): never {
  const status = ok ? 'ok' : 'err';
  redirect(`${path}?status=${status}&msg=${encodeURIComponent(message)}`);
}

// ── Umumiy sozlamalar ───────────────────────────────────────────────────────

export async function saveGeneralSettings(guildId: string, form: FormData): Promise<void> {
  const path = `/dashboard/${guildId}/settings`;
  let ok = false;
  let message = 'Xatolik';

  try {
    const session = await assertGuildAccess(guildId);
    const locale = text(form, 'locale') ?? 'uz';

    const patch = {
      locale: ['uz', 'ru', 'en'].includes(locale) ? locale : 'uz',
      dm_on_punish: bool(form, 'dm_on_punish'),
      mod_log_channel_id: snowflake(form, 'mod_log_channel_id'),
      message_log_channel_id: snowflake(form, 'message_log_channel_id'),
      member_log_channel_id: snowflake(form, 'member_log_channel_id'),
      server_log_channel_id: snowflake(form, 'server_log_channel_id'),
      voice_log_channel_id: snowflake(form, 'voice_log_channel_id'),
      welcome_channel_id: snowflake(form, 'welcome_channel_id'),
      welcome_message: text(form, 'welcome_message'),
      goodbye_channel_id: snowflake(form, 'goodbye_channel_id'),
      goodbye_message: text(form, 'goodbye_message'),
      autorole_id: snowflake(form, 'autorole_id'),
    };

    const { error } = await db
      .from('guilds')
      .upsert({ guild_id: guildId, ...patch }, { onConflict: 'guild_id' });

    if (error) {
      message = `Saqlanmadi: ${error.message}`;
    } else {
      await audit(guildId, session.userId, session.username, 'settings.update', patch);
      revalidatePath(path);
      ok = true;
      message = 'Saqlandi. Bot 1 daqiqa ichida yangi sozlamalarni oladi.';
    }
  } catch (error) {
    message = error instanceof Error ? error.message : 'Xatolik';
  }

  back(path, ok, message);
}

// ── Modullar ────────────────────────────────────────────────────────────────

const MODULES = [
  'moderation',
  'automod',
  'logging',
  'welcome',
  'roles',
  'leveling',
  'tickets',
  'starboard',
];

export async function saveModules(guildId: string, form: FormData): Promise<void> {
  const path = `/dashboard/${guildId}`;
  let ok = false;
  let message = 'Xatolik';

  try {
    const session = await assertGuildAccess(guildId);
    const modules: Record<string, boolean> = {};
    for (const name of MODULES) modules[name] = bool(form, `module_${name}`);

    const { error } = await db
      .from('guilds')
      .upsert({ guild_id: guildId, modules }, { onConflict: 'guild_id' });

    if (error) {
      message = error.message;
    } else {
      await audit(guildId, session.userId, session.username, 'modules.update', modules);
      revalidatePath(path);
      ok = true;
      message = 'Modullar yangilandi.';
    }
  } catch (error) {
    message = error instanceof Error ? error.message : 'Xatolik';
  }

  back(path, ok, message);
}

// ── AutoMod ─────────────────────────────────────────────────────────────────

export async function saveAutoModSettings(guildId: string, form: FormData): Promise<void> {
  const path = `/dashboard/${guildId}/automod`;
  let ok = false;
  let message = 'Xatolik';

  try {
    const session = await assertGuildAccess(guildId);
    const punishment = text(form, 'punishment') ?? 'warn';

    const xpPatch = {
      enabled: bool(form, 'enabled'),
      anti_spam: bool(form, 'anti_spam'),
      anti_duplicate: bool(form, 'anti_duplicate'),
      anti_invite: bool(form, 'anti_invite'),
      anti_link: bool(form, 'anti_link'),
      anti_mention: bool(form, 'anti_mention'),
      anti_caps: bool(form, 'anti_caps'),
      anti_emoji: bool(form, 'anti_emoji'),
      word_filter: bool(form, 'word_filter'),
      anti_raid: bool(form, 'anti_raid'),
      spam_limit: int(form, 'spam_limit', 5, 2, 50),
      spam_window_ms: int(form, 'spam_window_seconds', 5, 1, 120) * 1000,
      mention_limit: int(form, 'mention_limit', 5, 1, 50),
      caps_percent: int(form, 'caps_percent', 70, 10, 100),
      emoji_limit: int(form, 'emoji_limit', 10, 1, 100),
      raid_join_limit: int(form, 'raid_join_limit', 8, 2, 100),
      raid_window_ms: int(form, 'raid_window_seconds', 15, 1, 600) * 1000,
      min_account_age_days: int(form, 'min_account_age_days', 0, 0, 365),
      punishment: ['delete', 'warn', 'timeout', 'kick', 'ban'].includes(punishment)
        ? punishment
        : 'warn',
      punishment_ms: int(form, 'punishment_minutes', 10, 0, 40320) * 60_000,
    };

    const { error } = await db
      .from('automod_settings')
      .upsert({ guild_id: guildId, ...xpPatch }, { onConflict: 'guild_id' });

    if (error) {
      message = `Saqlanmadi: ${error.message}`;
    } else {
      await audit(guildId, session.userId, session.username, 'automod.update', xpPatch);
      revalidatePath(path);
      ok = true;
      message = 'AutoMod sozlamalari saqlandi.';
    }
  } catch (error) {
    message = error instanceof Error ? error.message : 'Xatolik';
  }

  back(path, ok, message);
}

export async function addFilteredWord(guildId: string, form: FormData): Promise<void> {
  const path = `/dashboard/${guildId}/automod`;
  let ok = false;
  let message = 'Xatolik';

  try {
    const session = await assertGuildAccess(guildId);
    const clean = (text(form, 'word') ?? '').toLowerCase().slice(0, 60);

    if (!clean) {
      message = "So'z kiritilmadi";
    } else {
      const { error } = await db.from('filtered_words').insert({ guild_id: guildId, word: clean });
      if (error) {
        message = error.message.includes('duplicate')
          ? "Bu so'z allaqachon ro'yxatda"
          : error.message;
      } else {
        await audit(guildId, session.userId, session.username, 'automod.word.add', { word: clean });
        revalidatePath(path);
        ok = true;
        message = `"${clean}" qo'shildi`;
      }
    }
  } catch (error) {
    message = error instanceof Error ? error.message : 'Xatolik';
  }

  back(path, ok, message);
}

export async function removeFilteredWord(guildId: string, form: FormData): Promise<void> {
  const path = `/dashboard/${guildId}/automod`;
  let ok = false;
  let message = 'Xatolik';

  try {
    const session = await assertGuildAccess(guildId);
    const word = text(form, 'word') ?? '';

    const { error } = await db
      .from('filtered_words')
      .delete()
      .eq('guild_id', guildId)
      .eq('word', word);

    if (error) {
      message = error.message;
    } else {
      await audit(guildId, session.userId, session.username, 'automod.word.remove', { word });
      revalidatePath(path);
      ok = true;
      message = `"${word}" o'chirildi`;
    }
  } catch (error) {
    message = error instanceof Error ? error.message : 'Xatolik';
  }

  back(path, ok, message);
}

// ── Moderatsiya ─────────────────────────────────────────────────────────────

export async function deactivateCase(guildId: string, form: FormData): Promise<void> {
  const path = `/dashboard/${guildId}/cases`;
  let ok = false;
  let message = 'Xatolik';

  try {
    const session = await assertGuildAccess(guildId);
    const caseNumber = int(form, 'case_number', 0, 1, 10_000_000);

    if (caseNumber === 0) {
      message = "Case raqami noto'g'ri";
    } else {
      const { error } = await db
        .from('mod_cases')
        .update({ active: false })
        .eq('guild_id', guildId)
        .eq('case_number', caseNumber);

      if (error) {
        message = error.message;
      } else {
        await audit(guildId, session.userId, session.username, 'case.deactivate', { caseNumber });
        revalidatePath(path);
        ok = true;
        message = `Case #${caseNumber} bekor qilindi`;
      }
    }
  } catch (error) {
    message = error instanceof Error ? error.message : 'Xatolik';
  }

  back(path, ok, message);
}

// ── Leveling ────────────────────────────────────────────────────────────────

export async function saveLevelSettings(guildId: string, form: FormData): Promise<void> {
  const path = `/dashboard/${guildId}/leveling`;
  let ok = false;
  let message = 'Xatolik';

  try {
    const session = await assertGuildAccess(guildId);

    const xpMin = int(form, 'xp_min', 15, 1, 500);
    const patch = {
      enabled: bool(form, 'enabled'),
      xp_min: xpMin,
      xp_max: Math.max(int(form, 'xp_max', 25, 1, 500), xpMin),
      cooldown_seconds: int(form, 'cooldown_seconds', 60, 0, 3600),
      announce_enabled: bool(form, 'announce_enabled'),
      announce_channel_id: snowflake(form, 'announce_channel_id'),
      level_up_message:
        text(form, 'level_up_message') ??
        'Tabriklaymiz {user}, siz **{level}**-darajaga yetdingiz!',
      stack_rewards: bool(form, 'stack_rewards'),
    };

    const { error } = await db
      .from('level_settings')
      .upsert({ guild_id: guildId, ...patch }, { onConflict: 'guild_id' });

    if (error) {
      message = `Saqlanmadi: ${error.message}`;
    } else {
      await audit(guildId, session.userId, session.username, 'leveling.update', patch);
      revalidatePath(path);
      ok = true;
      message = 'Leveling sozlamalari saqlandi.';
    }
  } catch (error) {
    message = error instanceof Error ? error.message : 'Xatolik';
  }

  back(path, ok, message);
}
