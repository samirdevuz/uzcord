import { AuditLogEvent, EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import { COLORS } from '../utils/embeds';

export default defineEvent(Events.GuildBanRemove, async (client, ban) => {
  const settings = getSettings(ban.guild.id);
  const t = createTranslator(settings.locale);

  const entry = await ban.guild
    .fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 5 })
    .then((logs) => logs.entries.find((item) => item.target?.id === ban.user.id))
    .catch(() => null);

  if (entry?.executor?.id === client.user?.id) return;

  await sendLog(
    ban.guild,
    'member',
    new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle(`🔓 ${t('log.banRemoved')}`)
      .setThumbnail(ban.user.displayAvatarURL())
      .addFields(
        { name: t('common.user'), value: `${ban.user.tag}\n\`${ban.user.id}\``, inline: true },
        {
          name: t('common.moderator'),
          value: entry?.executor ? `<@${entry.executor.id}>` : t('common.none'),
          inline: true,
        }
      )
      .setTimestamp()
  );
});
