import { EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import { COLORS, truncate } from '../utils/embeds';

export default defineEvent(Events.GuildMemberUpdate, async (_client, oldMember, newMember) => {
  const settings = getSettings(newMember.guild.id);
  const t = createTranslator(settings.locale);

  // Nickname o'zgarishi
  if (oldMember.nickname !== newMember.nickname) {
    await sendLog(
      newMember.guild,
      'member',
      new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`📝 ${t('log.nicknameChanged')}`)
        .addFields(
          { name: t('common.user'), value: `<@${newMember.id}>`, inline: true },
          { name: t('log.before'), value: oldMember.nickname ?? t('common.none'), inline: true },
          { name: t('log.after'), value: newMember.nickname ?? t('common.none'), inline: true }
        )
        .setTimestamp()
    );
  }

  // Rollar o'zgarishi
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;
  const added = newRoles.filter((role) => !oldRoles.has(role.id));
  const removed = oldRoles.filter((role) => !newRoles.has(role.id));

  if (added.size > 0 || removed.size > 0) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.purple)
      .setTitle(`🎭 ${t('log.rolesChanged')}`)
      .addFields({ name: t('common.user'), value: `<@${newMember.id}>` })
      .setTimestamp();

    if (added.size > 0) {
      embed.addFields({
        name: `➕ ${t('log.rolesAdded')}`,
        value: truncate(added.map((role) => `<@&${role.id}>`).join(' '), 800),
      });
    }
    if (removed.size > 0) {
      embed.addFields({
        name: `➖ ${t('log.rolesRemoved')}`,
        value: truncate(removed.map((role) => `<@&${role.id}>`).join(' '), 800),
      });
    }

    await sendLog(newMember.guild, 'member', embed);
  }
});
