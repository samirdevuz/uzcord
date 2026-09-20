import { EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { handleLeave } from '../modules/welcome';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import { COLORS, truncate } from '../utils/embeds';
import { fullDate } from '../utils/time';

export default defineEvent(Events.GuildMemberRemove, async (_client, member) => {
  const settings = getSettings(member.guild.id);
  const t = createTranslator(settings.locale);

  const roles = member.roles?.cache
    .filter((role) => role.id !== member.guild.id)
    .map((role) => `<@&${role.id}>`);

  await sendLog(
    member.guild,
    'member',
    new EmbedBuilder()
      .setColor(COLORS.danger)
      .setTitle(`📤 ${t('log.memberLeft')}`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: t('common.user'), value: `<@${member.id}>\n\`${member.id}\``, inline: true },
        {
          name: t('log.joinedAt'),
          value: member.joinedTimestamp ? fullDate(member.joinedTimestamp) : t('common.none'),
          inline: true,
        },
        {
          name: t('util.roles'),
          value: roles && roles.length > 0 ? truncate(roles.join(' '), 800) : t('common.none'),
        }
      )
      .setFooter({ text: t('log.memberCount', { count: member.guild.memberCount }) })
      .setTimestamp()
  );

  await handleLeave(member);
});
