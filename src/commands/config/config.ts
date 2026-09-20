import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { defineCommand } from '../../core/types';
import {
  getEscalations,
  getSettings,
  isModuleEnabled,
  LOG_COLUMNS,
  MODULE_NAMES,
  removeEscalation,
  setEscalation,
  setLogChannel,
  setModule,
  updateSettings,
  type GuildSettings,
  type LogKind,
  type ModuleName,
} from '../../db/guilds';
import { reply } from '../../modules/moderation/actions';
import { DEFAULT_GOODBYE, DEFAULT_WELCOME } from '../../modules/welcome';
import { brandEmbed, errorEmbed, successEmbed, truncate } from '../../utils/embeds';
import { canManageRole } from '../../utils/permissions';
import { formatDuration, parseDuration } from '../../utils/time';
import { isLocale, LOCALE_LABELS } from '../../i18n';

const LOG_KIND_LABELS: Record<LogKind, string> = {
  mod: 'Moderatsiya',
  message: 'Xabarlar',
  member: "A'zolar",
  server: 'Server',
  voice: 'Ovozli kanallar',
};

export default defineCommand({
  category: 'config',
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription("UzCord sozlamalarini boshqaradi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub.setName('view').setDescription("Joriy sozlamalarni ko'rsatadi")
    )
    .addSubcommand((sub) =>
      sub
        .setName('locale')
        .setDescription("Bot tilini o'zgartiradi")
        .addStringOption((option) =>
          option
            .setName('value')
            .setDescription('Til')
            .setRequired(true)
            .addChoices(
              { name: "O'zbekcha", value: 'uz' },
              { name: 'Русский', value: 'ru' },
              { name: 'English', value: 'en' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('logs')
        .setDescription("Log kanalini o'rnatadi yoki o'chiradi")
        .addStringOption((option) =>
          option
            .setName('kind')
            .setDescription('Log turi')
            .setRequired(true)
            .addChoices(
              { name: 'Moderatsiya (ban, warn, ...)', value: 'mod' },
              { name: "Xabarlar (o'chirish, tahrirlash)", value: 'message' },
              { name: "A'zolar (kirish, chiqish, rollar)", value: 'member' },
              { name: 'Server (kanal, rol)', value: 'server' },
              { name: 'Ovozli kanallar', value: 'voice' }
            )
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription("Kanal (bo'sh qoldirilsa log o'chadi)")
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('welcome')
        .setDescription("Xush kelibsiz xabarini sozlaydi")
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription("Kanal (bo'sh = o'chirish)")
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) =>
          option.setName('message').setDescription('Xabar matni').setMaxLength(1500)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('goodbye')
        .setDescription("Xayrlashuv xabarini sozlaydi")
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription("Kanal (bo'sh = o'chirish)")
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) =>
          option.setName('message').setDescription('Xabar matni').setMaxLength(1500)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('autorole')
        .setDescription("Yangi a'zoga avtomatik beriladigan rol")
        .addRoleOption((option) =>
          option.setName('role').setDescription("Rol (bo'sh = o'chirish)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('module')
        .setDescription("Modulni yoqadi yoki o'chiradi")
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('Modul')
            .setRequired(true)
            .addChoices(
              { name: 'moderation', value: 'moderation' },
              { name: 'automod', value: 'automod' },
              { name: 'logging', value: 'logging' },
              { name: 'welcome', value: 'welcome' },
              { name: 'roles', value: 'roles' },
              { name: 'leveling', value: 'leveling' },
              { name: 'tickets', value: 'tickets' },
              { name: 'starboard', value: 'starboard' }
            )
        )
        .addBooleanOption((option) =>
          option.setName('enabled').setDescription('Yoqilsinmi?').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('dm')
        .setDescription("Jazolangan a'zoga shaxsiy xabar yuborilsinmi")
        .addBooleanOption((option) =>
          option.setName('enabled').setDescription('Yoqilsinmi?').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('escalation')
        .setDescription("Ogohlantirishlar soniga qarab avtomatik jazo qo'shadi")
        .addIntegerOption((option) =>
          option
            .setName('count')
            .setDescription('Ogohlantirishlar soni')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(50)
        )
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Qo\'llaniladigan jazo')
            .setRequired(true)
            .addChoices(
              { name: 'timeout', value: 'timeout' },
              { name: 'kick', value: 'kick' },
              { name: 'ban', value: 'ban' }
            )
        )
        .addStringOption((option) =>
          option.setName('duration').setDescription('Muddat (timeout/ban uchun), masalan 1h')
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('escalation-remove')
        .setDescription("Avtomatik jazo qoidasini o'chiradi")
        .addIntegerOption((option) =>
          option.setName('count').setDescription('Ogohlantirishlar soni').setRequired(true)
        )
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const sub = interaction.options.getSubcommand();

    // Sozlamalar Supabase ga yoziladi — 3 soniyalik javob chegarasidan
    // oshib ketmaslik uchun darhol defer qilamiz.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // ── view ────────────────────────────────────────────────────────────────
    if (sub === 'view') {
      const settings = getSettings(guild.id);
      const embed = brandEmbed(t('config.title', { guild: guild.name }));

      const logLines = (Object.keys(LOG_COLUMNS) as LogKind[]).map((kind) => {
        const value = settings[LOG_COLUMNS[kind]] as string | null;
        return `**${LOG_KIND_LABELS[kind]}:** ${value ? `<#${value}>` : t('common.none')}`;
      });

      const moduleLines = MODULE_NAMES.map(
        (name) =>
          `**${name}:** ${isModuleEnabled(settings, name) ? '🟢 ' + t('common.enabled') : '🔴 ' + t('common.disabled')}`
      );

      const escalations = await getEscalations(guild.id);
      const escalationText =
        escalations.length === 0
          ? t('config.escalationEmpty')
          : escalations
              .map(
                (item) =>
                  `**${item.warn_count}** ogohlantirish → \`${item.action}\`` +
                  (item.duration_ms ? ` (${formatDuration(item.duration_ms)})` : '')
              )
              .join('\n');

      embed.addFields(
        {
          name: '🌐 Til',
          value: LOCALE_LABELS[isLocale(settings.locale) ? settings.locale : 'uz'],
          inline: true,
        },
        {
          name: '📨 Jazoda shaxsiy xabar',
          value: settings.dm_on_punish ? t('common.enabled') : t('common.disabled'),
          inline: true,
        },
        {
          name: '🎭 Avtomatik rol',
          value: settings.autorole_id ? `<@&${settings.autorole_id}>` : t('common.none'),
          inline: true,
        },
        { name: '📋 Log kanallari', value: logLines.join('\n') },
        {
          name: '👋 Xush kelibsiz',
          value: settings.welcome_channel_id
            ? `<#${settings.welcome_channel_id}>\n${truncate(settings.welcome_message ?? DEFAULT_WELCOME, 200)}`
            : t('common.none'),
        },
        {
          name: '🚪 Xayrlashuv',
          value: settings.goodbye_channel_id
            ? `<#${settings.goodbye_channel_id}>\n${truncate(settings.goodbye_message ?? DEFAULT_GOODBYE, 200)}`
            : t('common.none'),
        },
        { name: '🧩 Modullar', value: moduleLines.join('\n') },
        { name: '📈 Avtomatik jazolar', value: escalationText }
      );

      await reply(interaction, embed, true);
      return;
    }

    // ── locale ──────────────────────────────────────────────────────────────
    if (sub === 'locale') {
      const value = interaction.options.getString('value', true);
      await updateSettings(guild.id, { locale: value });
      await reply(
        interaction,
        successEmbed(
          t('config.localeSet', {
            locale: LOCALE_LABELS[isLocale(value) ? value : 'uz'],
          })
        ),
        true
      );
      return;
    }

    // ── logs ────────────────────────────────────────────────────────────────
    if (sub === 'logs') {
      const kind = interaction.options.getString('kind', true) as LogKind;
      const channel = interaction.options.getChannel('channel');
      await setLogChannel(guild.id, kind, channel?.id ?? null);
      await reply(
        interaction,
        successEmbed(
          channel
            ? t('config.logSet', { kind: LOG_KIND_LABELS[kind], channel: `<#${channel.id}>` })
            : t('config.logCleared', { kind: LOG_KIND_LABELS[kind] })
        ),
        true
      );
      return;
    }

    // ── welcome / goodbye ───────────────────────────────────────────────────
    if (sub === 'welcome' || sub === 'goodbye') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message');
      const isWelcome = sub === 'welcome';

      const patch: Partial<GuildSettings> = isWelcome
        ? { welcome_channel_id: channel?.id ?? null }
        : { goodbye_channel_id: channel?.id ?? null };
      if (message) {
        if (isWelcome) patch.welcome_message = message;
        else patch.goodbye_message = message;
      }
      await updateSettings(guild.id, patch);

      if (!channel) {
        await reply(
          interaction,
          successEmbed(t(isWelcome ? 'config.welcomeCleared' : 'config.goodbyeCleared')),
          true
        );
        return;
      }

      const embed = successEmbed(
        t(isWelcome ? 'config.welcomeSet' : 'config.goodbyeSet', {
          channel: `<#${channel.id}>`,
        })
      ).setFooter({ text: t('config.placeholders') });
      await reply(interaction, embed, true);
      return;
    }

    // ── autorole ────────────────────────────────────────────────────────────
    if (sub === 'autorole') {
      const role = interaction.options.getRole('role');
      if (!role) {
        await updateSettings(guild.id, { autorole_id: null });
        await reply(interaction, successEmbed(t('config.autoroleCleared')), true);
        return;
      }

      const me = guild.members.me!;
      if (!canManageRole(me, role.id)) {
        await reply(interaction, errorEmbed(t('roles.roleTooHigh')), true);
        return;
      }

      await updateSettings(guild.id, { autorole_id: role.id });
      await reply(interaction, successEmbed(t('config.autoroleSet', { role: role.name })), true);
      return;
    }

    // ── module ──────────────────────────────────────────────────────────────
    if (sub === 'module') {
      const name = interaction.options.getString('name', true) as ModuleName;
      const enabled = interaction.options.getBoolean('enabled', true);
      await setModule(guild.id, name, enabled);
      await reply(
        interaction,
        successEmbed(
          t('config.moduleSet', {
            module: name,
            state: enabled ? t('common.enabled') : t('common.disabled'),
          })
        ),
        true
      );
      return;
    }

    // ── dm ──────────────────────────────────────────────────────────────────
    if (sub === 'dm') {
      const enabled = interaction.options.getBoolean('enabled', true);
      await updateSettings(guild.id, { dm_on_punish: enabled });
      await reply(
        interaction,
        successEmbed(
          t('config.dmSet', { state: enabled ? t('common.enabled') : t('common.disabled') })
        ),
        true
      );
      return;
    }

    // ── escalation ──────────────────────────────────────────────────────────
    if (sub === 'escalation') {
      const count = interaction.options.getInteger('count', true);
      const action = interaction.options.getString('action', true) as 'timeout' | 'kick' | 'ban';
      const durationRaw = interaction.options.getString('duration');

      let durationMs: number | null = null;
      if (durationRaw) {
        durationMs = parseDuration(durationRaw);
        if (durationMs === null) {
          await reply(interaction, errorEmbed(t('error.invalidDuration')), true);
          return;
        }
      }
      if (action === 'timeout' && durationMs === null) durationMs = 60 * 60 * 1000;

      await setEscalation(guild.id, count, action, durationMs);
      await reply(
        interaction,
        successEmbed(t('config.escalationSet', { count, action })),
        true
      );
      return;
    }

    if (sub === 'escalation-remove') {
      const count = interaction.options.getInteger('count', true);
      const removed = await removeEscalation(guild.id, count);
      await reply(
        interaction,
        removed
          ? successEmbed(t('config.escalationRemoved', { count }))
          : errorEmbed(t('config.escalationEmpty')),
        true
      );
    }
  },
});
