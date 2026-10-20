import { EmbedBuilder, type Client } from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings } from '../../db/guilds';
import { markReminderDelivered, type Reminder } from '../../db/reminders';
import { createTranslator } from '../../i18n';
import { COLORS, truncate } from '../../utils/embeds';

const log = createLogger('reminders');

/**
 * Eslatmani yetkazadi: avval belgilangan kanalga, bo'lmasa shaxsiy xabarga.
 * Yetkazib bo'lmasa ham "yetkazildi" deb belgilanadi — aks holda har 30
 * soniyada qayta urinib, cheksiz takrorlanardi.
 */
export async function deliverReminder(client: Client, reminder: Reminder): Promise<void> {
  const t = createTranslator(reminder.guild_id ? getSettings(reminder.guild_id).locale : 'uz');
  const setAt = Math.floor(new Date(reminder.created_at).getTime() / 1000);
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`⏰ ${t('remind.deliverTitle')}`)
    .setDescription(truncate(reminder.content, 4000))
    .setFooter({ text: `#${reminder.id}` })
    .addFields({ name: '​', value: t('remind.deliverSet', { time: `<t:${setAt}:R>` }) });

  let delivered = false;
  try {
    if (reminder.channel_id) {
      const channel = await client.channels.fetch(reminder.channel_id).catch(() => null);
      if (channel?.isTextBased() && 'send' in channel) {
        await channel.send({ content: `<@${reminder.user_id}>`, embeds: [embed], allowedMentions: { users: [reminder.user_id] } });
        delivered = true;
      }
    }
    if (!delivered) {
      const user = await client.users.fetch(reminder.user_id);
      await user.send({ embeds: [embed] });
      delivered = true;
    }
  } catch (error) {
    log.warn(`Eslatma #${reminder.id} yetkazilmadi:`, error);
  } finally {
    await markReminderDelivered(reminder.id);
  }
}
