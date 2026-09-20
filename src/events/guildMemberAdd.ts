import { EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { inspectJoin } from '../modules/automod/engine';
import { handleJoin } from '../modules/welcome';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import { COLORS } from '../utils/embeds';
import { fullDate, relative } from '../utils/time';

export default defineEvent(Events.GuildMemberAdd, async (_client, member) => {
  // Avval xavfsizlik tekshiruvi: a'zo chiqarilsa, qolgan amallar bajarilmaydi.
  const removed = await inspectJoin(member);
  if (removed) return;

  const settings = getSettings(member.guild.id);
  const t = createTranslator(settings.locale);

  await sendLog(
    member.guild,
    'member',
    new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle(`📥 ${t('log.memberJoined')}`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: t('common.user'), value: `<@${member.id}>\n\`${member.id}\``, inline: true },
        {
          name: t('log.accountCreated'),
          value: `${fullDate(member.user.createdTimestamp)}\n${relative(member.user.createdTimestamp)}`,
          inline: true,
        }
      )
      .setFooter({ text: t('log.memberCount', { count: member.guild.memberCount }) })
      .setTimestamp()
  );

  await handleJoin(member);
});
