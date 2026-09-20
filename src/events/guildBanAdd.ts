import { AuditLogEvent, EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import { COLORS, truncate } from '../utils/embeds';

export default defineEvent(Events.GuildBanAdd, async (client, ban) => {
  const settings = getSettings(ban.guild.id);
  const t = createTranslator(settings.locale);

  // Kim ban qilganini audit logdan topamiz (bot o'zi qilgan bo'lsa — yozmaymiz,
  // chunki u allaqachon case sifatida loglangan).
  const entry = await ban.guild
    .fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 })
    .then((logs) => logs.entries.find((item) => item.target?.id === ban.user.id))
    .catch(() => null);

  if (entry?.executor?.id === client.user?.id) return;

  await sendLog(
    ban.guild,
    'member',
    new EmbedBuilder()
      .setColor(COLORS.danger)
      .setTitle(`🔨 ${t('log.banAdded')}`)
      .setThumbnail(ban.user.displayAvatarURL())
      .addFields(
        { name: t('common.user'), value: `${ban.user.tag}\n\`${ban.user.id}\``, inline: true },
        {
          name: t('common.moderator'),
          value: entry?.executor ? `<@${entry.executor.id}>` : t('common.none'),
          inline: true,
        },
        {
          name: t('common.reason'),
          value: truncate(entry?.reason ?? ban.reason ?? t('common.noReason')),
        }
      )
      .setTimestamp()
  );
});
