"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const help_1 = require("../../modules/help");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
/** package.json versiyasi — src (tsx) va dist ikkalasidan ham bir xil yo'l. */
function botVersion() {
    try {
        const file = node_path_1.default.join(__dirname, '..', '..', '..', 'package.json');
        return JSON.parse(node_fs_1.default.readFileSync(file, 'utf8')).version ?? '—';
    }
    catch {
        return '—';
    }
}
const VERSION = botVersion();
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    guildOnly: false,
    data: new discord_js_1.SlashCommandBuilder().setName('botinfo').setDescription('UzCord haqida: statistika va havolalar'),
    async execute(interaction, ctx) {
        const { t, client } = ctx;
        const members = client.guilds.cache.reduce((sum, guild) => sum + (guild.memberCount ?? 0), 0);
        const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.brand)
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setDescription(t('util.botInfoDescription'))
            .addFields({ name: `🏠 ${t('util.servers')}`, value: client.guilds.cache.size.toLocaleString('uz-UZ'), inline: true }, { name: `👥 ${t('util.members')}`, value: members.toLocaleString('uz-UZ'), inline: true }, { name: `⌨️ ${t('util.commands')}`, value: String(client.commands.size), inline: true }, { name: `⏱️ ${t('util.uptime')}`, value: (0, time_1.formatDuration)(client.uptime ?? 0, 2), inline: true }, { name: `📶 ${t('util.latencyWs')}`, value: `${Math.max(client.ws.ping, 0)} ms`, inline: true }, { name: `🧠 ${t('util.memory')}`, value: `${memoryMb} MB`, inline: true }, {
            name: `🔧 ${t('util.versions')}`,
            value: `UzCord **v${VERSION}** · discord.js **v${discord_js_1.version}** · Node.js **${process.version}**`,
        })
            .setFooter((0, embeds_1.brandFooter)(t('util.botInfoFooter')))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], components: [(0, help_1.linkButtons)(t, client.user.id)] });
    },
});
//# sourceMappingURL=botinfo.js.map