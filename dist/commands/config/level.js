"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const leveling_1 = require("../../db/leveling");
const leveling_2 = require("../../modules/leveling");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
exports.default = (0, types_1.defineCommand)({
    category: 'config',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('level')
        .setDescription('Leveling (XP) tizimini sozlash')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('enable')
        .setDescription('Leveling tizimini yoqadi yoki o\'chiradi')
        .addBooleanOption((opt) => opt.setName('value').setDescription('Yoqilsinmi?').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('settings')
        .setDescription('XP miqdori va kutish vaqti')
        .addIntegerOption((opt) => opt.setName('xp_min').setDescription('Har xabar uchun eng kam XP').setMinValue(1).setMaxValue(500))
        .addIntegerOption((opt) => opt.setName('xp_max').setDescription('Har xabar uchun eng ko\'p XP').setMinValue(1).setMaxValue(500))
        .addIntegerOption((opt) => opt.setName('cooldown').setDescription('XP berish oralig\'i (soniya)').setMinValue(0).setMaxValue(3600)))
        .addSubcommand((sub) => sub
        .setName('announce')
        .setDescription("Yangi daraja e'lonlari")
        .addBooleanOption((opt) => opt.setName('enabled').setDescription("E'lon qilinsinmi?"))
        .addChannelOption((opt) => opt.setName('channel').setDescription("E'lon kanali (bo'sh = xabar yozilgan kanal)").addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addBooleanOption((opt) => opt.setName('same_channel').setDescription("E'lonlar xabar yozilgan kanalga yuborilsin"))
        .addStringOption((opt) => opt.setName('message').setDescription("Matn: {user} {user.name} {level} {server}").setMaxLength(500)))
        .addSubcommand((sub) => sub
        .setName('reward-add')
        .setDescription('Darajaga yetganda beriladigan rol')
        .addIntegerOption((opt) => opt.setName('level').setDescription('Daraja').setMinValue(1).setMaxValue(500).setRequired(true))
        .addRoleOption((opt) => opt.setName('role').setDescription('Rol').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('reward-remove')
        .setDescription('Daraja mukofotini olib tashlaydi')
        .addIntegerOption((opt) => opt.setName('level').setDescription('Daraja').setMinValue(1).setMaxValue(500).setRequired(true)))
        .addSubcommand((sub) => sub.setName('status').setDescription('Joriy sozlamalar va mukofotlar')),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const subcommand = interaction.options.getSubcommand();
        const save = async (patch) => {
            await (0, leveling_1.updateLevelSettings)(guild.id, patch);
            (0, leveling_2.invalidateLevelSettings)(guild.id);
        };
        if (subcommand === 'enable') {
            const value = interaction.options.getBoolean('value', true);
            await save({ enabled: value });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('level.toggled', { state: t(value ? 'level.stateOn' : 'level.stateOff') })));
            return;
        }
        if (subcommand === 'settings') {
            const current = await (0, leveling_1.getLevelSettings)(guild.id);
            const xpMin = interaction.options.getInteger('xp_min') ?? current.xp_min;
            const xpMax = Math.max(interaction.options.getInteger('xp_max') ?? current.xp_max, xpMin);
            const cooldown = interaction.options.getInteger('cooldown') ?? current.cooldown_seconds;
            await save({ xp_min: xpMin, xp_max: xpMax, cooldown_seconds: cooldown });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('level.settingsSaved', { min: xpMin, max: xpMax, cooldown })), true);
            return;
        }
        if (subcommand === 'announce') {
            const patch = {};
            const enabled = interaction.options.getBoolean('enabled');
            const channel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message');
            if (enabled !== null)
                patch.announce_enabled = enabled;
            const sameChannel = interaction.options.getBoolean('same_channel');
            if (channel)
                patch.announce_channel_id = channel.id;
            else if (sameChannel)
                patch.announce_channel_id = null;
            if (message)
                patch.level_up_message = message;
            await save(patch);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(channel
                ? t('level.channelSet', { channel: `<#${channel.id}>` })
                : sameChannel
                    ? t('level.channelCleared')
                    : t('level.announceSaved')), true);
            return;
        }
        if (subcommand === 'reward-add') {
            const level = interaction.options.getInteger('level', true);
            const role = interaction.options.getRole('role', true);
            if (!(0, permissions_1.canManageRole)(guild.members.me, role.id)) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('roles.roleTooHigh')), true);
                return;
            }
            await (0, leveling_1.setLevelReward)(guild.id, level, role.id);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('level.rewardSet', { level, role: `<@&${role.id}>` })));
            return;
        }
        if (subcommand === 'reward-remove') {
            const level = interaction.options.getInteger('level', true);
            await (0, leveling_1.removeLevelReward)(guild.id, level);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('level.rewardRemoved', { level })));
            return;
        }
        // status
        const [settings, rewards] = await Promise.all([(0, leveling_1.getLevelSettings)(guild.id), (0, leveling_1.getLevelRewards)(guild.id)]);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.brand)
            .setTitle(`⭐ ${t('level.statusTitle')}`)
            .addFields({ name: t('level.fieldEnabled'), value: settings.enabled ? '✅' : '❌', inline: true }, { name: 'XP', value: `${settings.xp_min}–${settings.xp_max}`, inline: true }, { name: t('level.fieldCooldown'), value: `${settings.cooldown_seconds}s`, inline: true }, {
            name: t('level.fieldAnnounce'),
            value: settings.announce_enabled
                ? settings.announce_channel_id
                    ? `<#${settings.announce_channel_id}>`
                    : t('level.sameChannel')
                : '❌',
            inline: true,
        }, {
            name: t('level.rewardsTitle'),
            value: rewards.length > 0 ? rewards.map((reward) => `**${reward.level}** → <@&${reward.role_id}>`).join('\n') : t('level.rewardsEmpty'),
        });
        await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral });
    },
});
//# sourceMappingURL=level.js.map