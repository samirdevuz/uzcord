import {
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildMember,
  type InteractionReplyOptions,
  type User,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { createCase, type CaseType, type ModCase, type NewCase } from '../../db/cases';
import { getSettings, type GuildSettings } from '../../db/guilds';
import { sendLog } from '../logging';
import { CASE_COLORS, CASE_EMOJI, errorEmbed, truncate } from '../../utils/embeds';
import { canTarget, TARGET_ERROR_KEYS } from '../../utils/permissions';
import { formatDuration } from '../../utils/time';
import type { Translator } from '../../i18n';

const log = createLogger('moderation');

/**
 * Moderator maqsadli a'zoga ta'sir qila oladimi? Yo'q bo'lsa,
 * foydalanuvchiga xatolik javobini o'zi yuboradi va `false` qaytaradi.
 */
export async function ensureTargetAllowed(
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  t: Translator
): Promise<boolean> {
  const guild = interaction.guild!;
  const me = guild.members.me;
  const executor = interaction.member as GuildMember;

  if (!me) return false;

  const verdict = canTarget(executor, target, me);
  if (verdict === 'ok') return true;

  await reply(interaction, errorEmbed(t(TARGET_ERROR_KEYS[verdict])));
  return false;
}

/** Interaction holatiga qarab to'g'ri javob metodini tanlaydi. */
export async function reply(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  ephemeral = false
): Promise<void> {
  // Aniq tip berilmasa TypeScript MessageFlags.Ephemeral ni umumiy MessageFlags
  // ga kengaytirib yuboradi va discord.js tiplariga mos kelmay qoladi.
  const payload: InteractionReplyOptions = { embeds: [embed] };
  if (ephemeral) payload.flags = MessageFlags.Ephemeral;
  if (interaction.deferred) {
    await interaction.editReply({ embeds: [embed] });
  } else if (interaction.replied) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
}

/** Jazolangan foydalanuvchiga shaxsiy xabar yuboradi (imkoni bo'lsa). */
export async function dmPunishment(
  user: User,
  guild: Guild,
  type: CaseType,
  reason: string | null,
  durationMs: number | null,
  t: Translator,
  settings: GuildSettings
): Promise<boolean> {
  if (!settings.dm_on_punish) return false;

  const key = (
    {
      ban: 'dm.ban',
      tempban: 'dm.tempban',
      kick: 'dm.kick',
      timeout: 'dm.timeout',
      warn: 'dm.warn',
    } as const
  )[type as 'ban' | 'tempban' | 'kick' | 'timeout' | 'warn'];

  if (!key) return false;

  const embed = new EmbedBuilder()
    .setColor(CASE_COLORS[type] ?? 0x95a5a6)
    .setDescription(
      t(key, { guild: guild.name, duration: durationMs ? formatDuration(durationMs) : '' })
    )
    .addFields({ name: t('common.reason'), value: truncate(reason ?? t('common.noReason')) })
    .setFooter({ text: t('dm.footer') })
    .setTimestamp();

  try {
    await user.send({ embeds: [embed] });
    return true;
  } catch {
    // Foydalanuvchi shaxsiy xabarlarni yopgan — bu xatolik emas.
    return false;
  }
}

/**
 * Case yaratadi va uni mod-log kanaliga yozadi.
 *
 * Discord amali allaqachon bajarilgan bo'ladi, shuning uchun baza yozuvi
 * muvaffaqiyatsiz bo'lsa ham komanda to'xtamaydi — o'rniga case_number = 0
 * bo'lgan vaqtinchalik yozuv qaytariladi va xato logga tushadi.
 */
export async function recordCase(
  guild: Guild,
  data: NewCase,
  t: Translator
): Promise<ModCase> {
  const created = await createCase(data);

  const modCase: ModCase = created ?? {
    id: 0,
    guild_id: data.guildId,
    case_number: 0,
    type: data.type,
    user_id: data.userId,
    user_tag: data.userTag ?? null,
    moderator_id: data.moderatorId,
    moderator_tag: data.moderatorTag ?? null,
    reason: data.reason ?? null,
    duration_ms: data.durationMs ?? null,
    active: true,
    created_at: Date.now(),
  };

  if (!created) {
    log.error(`Case bazaga yozilmadi (${data.guildId}/${data.type}/${data.userId})`);
  }

  try {
    await sendLog(guild, 'mod', buildCaseEmbed(modCase, t));
  } catch (error) {
    log.warn("Case logini yozib bo'lmadi:", error);
  }

  return modCase;
}

export function buildCaseEmbed(modCase: ModCase, t: Translator): EmbedBuilder {
  const emoji = CASE_EMOJI[modCase.type] ?? '📋';
  const embed = new EmbedBuilder()
    .setColor(CASE_COLORS[modCase.type] ?? 0x95a5a6)
    .setTitle(`${emoji} ${t('mod.caseTitle', { case: modCase.case_number, type: modCase.type })}`)
    .addFields(
      {
        name: t('common.user'),
        value: `${modCase.user_tag ?? 'Noma\'lum'}\n<@${modCase.user_id}>\n\`${modCase.user_id}\``,
        inline: true,
      },
      {
        name: t('common.moderator'),
        value: `${modCase.moderator_tag ?? 'Noma\'lum'}\n<@${modCase.moderator_id}>`,
        inline: true,
      }
    )
    .setTimestamp(modCase.created_at);

  if (modCase.duration_ms) {
    embed.addFields({
      name: t('common.duration'),
      value: formatDuration(modCase.duration_ms),
      inline: true,
    });
  }

  embed.addFields({
    name: t('common.reason'),
    value: truncate(modCase.reason ?? t('common.noReason')),
  });

  return embed;
}

/** Komandalarda ishlatiladigan standart sozlama yuklagich. */
export function settingsFor(guildId: string): GuildSettings {
  return getSettings(guildId);
}
