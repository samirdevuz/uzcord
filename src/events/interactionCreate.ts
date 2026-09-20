import { Collection, Events, MessageFlags, PermissionsBitField } from 'discord.js';
import { defineEvent, type CommandContext } from '../core/types';
import { createLogger } from '../core/logger';
import { defaultSettings, getSettings, isModuleEnabled } from '../db/guilds';
import { getPanelRoles } from '../db/roles';
import { roleIdFromCustomId } from '../modules/roles/panel';
import { createTranslator } from '../i18n';
import { errorEmbed } from '../utils/embeds';
import { canManageRole } from '../utils/permissions';

const log = createLogger('interaction');

export default defineEvent(Events.InteractionCreate, async (client, interaction) => {
  // ── Rol tugmalari ─────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const roleId = roleIdFromCustomId(interaction.customId);
    if (!roleId || !interaction.inCachedGuild()) return;

    const settings = getSettings(interaction.guildId);
    const t = createTranslator(settings.locale);

    if (!isModuleEnabled(settings, 'roles')) {
      await interaction.reply({
        embeds: [errorEmbed(t('error.moduleDisabled', { module: 'roles' }))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Tugma haqiqatan ham shu panelga tegishlimi?
    const panel = await getPanelRoles(interaction.message.id);
    if (!panel.some((item) => item.role_id === roleId)) return;

    const me = interaction.guild.members.me!;
    if (!canManageRole(me, roleId)) {
      await interaction.reply({
        embeds: [errorEmbed(t('roles.roleTooHigh'))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const role = interaction.guild.roles.cache.get(roleId)!;

    try {
      if (interaction.member.roles.cache.has(roleId)) {
        await interaction.member.roles.remove(role, 'Rollar paneli');
        await interaction.reply({
          content: t('roles.removed', { role: role.name }),
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.member.roles.add(role, 'Rollar paneli');
        await interaction.reply({
          content: t('roles.added', { role: role.name }),
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      log.warn('Rol tugmasi ishlamadi:', error);
      await interaction
        .reply({ embeds: [errorEmbed(t('error.generic'))], flags: MessageFlags.Ephemeral })
        .catch(() => null);
    }
    return;
  }

  // ── Slash komandalar ──────────────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    log.warn(`Noma'lum komanda: ${interaction.commandName}`);
    return;
  }

  const guildOnly = command.guildOnly !== false;
  if (guildOnly && !interaction.inGuild()) {
    await interaction.reply({
      embeds: [errorEmbed(createTranslator('uz')('error.guildOnly'))],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const settings = interaction.inGuild() ? getSettings(interaction.guildId) : defaultSettings();
  const t = createTranslator(settings.locale);

  // Modul o'chirilgan bo'lsa, moderatsiya komandalari ishlamaydi.
  if (command.category === 'moderation' && !isModuleEnabled(settings, 'moderation')) {
    await interaction.reply({
      embeds: [errorEmbed(t('error.moduleDisabled', { module: 'moderation' }))],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Kutish vaqti (cooldown)
  const cooldownSeconds = command.cooldown ?? 3;
  if (cooldownSeconds > 0) {
    if (!client.cooldowns.has(command.data.name)) {
      client.cooldowns.set(command.data.name, new Collection());
    }
    const timestamps = client.cooldowns.get(command.data.name)!;
    const expiresAt = timestamps.get(interaction.user.id);

    if (expiresAt && Date.now() < expiresAt) {
      const remaining = ((expiresAt - Date.now()) / 1000).toFixed(1);
      await interaction.reply({
        embeds: [errorEmbed(t('error.cooldown', { seconds: remaining }))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    timestamps.set(interaction.user.id, Date.now() + cooldownSeconds * 1000);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownSeconds * 1000).unref();
  }

  // Botning ruxsatlari yetarlimi?
  if (command.botPermissions?.length && interaction.inGuild()) {
    const me = interaction.guild?.members.me;
    const missing = command.botPermissions.filter(
      (permission) => !me?.permissions.has(permission)
    );
    if (missing.length > 0) {
      const names = missing
        .map((permission) => new PermissionsBitField(permission).toArray().join(', '))
        .join(', ');
      await interaction.reply({
        embeds: [errorEmbed(t('error.botMissingPermission', { permissions: names }))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  const ctx: CommandContext = { client, settings, t };

  try {
    await command.execute(interaction, ctx);
  } catch (error) {
    log.error(`/${interaction.commandName} xatolik berdi:`, error);
    const payload = {
      embeds: [errorEmbed(t('error.generic'), t('error.title'))],
      flags: MessageFlags.Ephemeral,
    };
    try {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: payload.embeds });
      } else if (interaction.replied) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    } catch {
      // Javob berish imkoni qolmadi.
    }
  }
});
