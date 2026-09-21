"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.ManageMessages],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('purge')
        .setDescription("Kanaldagi xabarlarni ommaviy o'chiradi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addIntegerOption((option) => option
        .setName('amount')
        .setDescription("Nechta xabar tekshirilsin (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
        .addUserOption((option) => option.setName('user').setDescription("Faqat shu foydalanuvchining xabarlari"))
        .addStringOption((option) => option.setName('contains').setDescription("Faqat shu matn bor xabarlar"))
        .addBooleanOption((option) => option.setName('bots').setDescription("Faqat botlarning xabarlari")),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const channel = interaction.channel;
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.channelType')), true);
            return;
        }
        const amount = interaction.options.getInteger('amount', true);
        const user = interaction.options.getUser('user');
        const contains = interaction.options.getString('contains')?.toLowerCase();
        const botsOnly = interaction.options.getBoolean('bots');
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const fetched = await channel.messages.fetch({ limit: amount });
        const cutoff = Date.now() - TWO_WEEKS;
        const target = fetched.filter((message) => {
            if (message.createdTimestamp < cutoff)
                return false;
            if (message.pinned)
                return false;
            if (user && message.author.id !== user.id)
                return false;
            if (botsOnly && !message.author.bot)
                return false;
            if (contains && !message.content.toLowerCase().includes(contains))
                return false;
            return true;
        });
        if (target.size === 0) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('mod.purgeEmpty')));
            return;
        }
        try {
            const deleted = await channel.bulkDelete(target, true);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.purged', { count: deleted.size })));
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })));
        }
    },
});
//# sourceMappingURL=purge.js.map