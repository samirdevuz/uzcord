"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverReminder = deliverReminder;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const reminders_1 = require("../../db/reminders");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
const log = (0, logger_1.createLogger)('reminders');
/**
 * Eslatmani yetkazadi: avval belgilangan kanalga, bo'lmasa shaxsiy xabarga.
 * Yetkazib bo'lmasa ham "yetkazildi" deb belgilanadi — aks holda har 30
 * soniyada qayta urinib, cheksiz takrorlanardi.
 */
async function deliverReminder(client, reminder) {
    const t = (0, i18n_1.createTranslator)(reminder.guild_id ? (0, guilds_1.getSettings)(reminder.guild_id).locale : 'uz');
    const setAt = Math.floor(new Date(reminder.created_at).getTime() / 1000);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.info)
        .setTitle(`⏰ ${t('remind.deliverTitle')}`)
        .setDescription((0, embeds_1.truncate)(reminder.content, 4000))
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
    }
    catch (error) {
        log.warn(`Eslatma #${reminder.id} yetkazilmadi:`, error);
    }
    finally {
        await (0, reminders_1.markReminderDelivered)(reminder.id);
    }
}
//# sourceMappingURL=index.js.map