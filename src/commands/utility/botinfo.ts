import fs from 'node:fs';
import path from 'node:path';
import { EmbedBuilder, SlashCommandBuilder, version as djsVersion } from 'discord.js';
import { defineCommand } from '../../core/types';
import { linkButtons } from '../../modules/help';
import { brandFooter, COLORS } from '../../utils/embeds';
import { formatDuration } from '../../utils/time';

/** package.json versiyasi — src (tsx) va dist ikkalasidan ham bir xil yo'l. */
function botVersion(): string {
  try {
    const file = path.join(__dirname, '..', '..', '..', 'package.json');
    return (JSON.parse(fs.readFileSync(file, 'utf8')) as { version?: string }).version ?? '—';
  } catch {
    return '—';
  }
}

const VERSION = botVersion();

export default defineCommand({
  category: 'utility',
  guildOnly: false,
  data: new SlashCommandBuilder().setName('botinfo').setDescription('UzCord haqida: statistika va havolalar'),

  async execute(interaction, ctx) {
    const { t, client } = ctx;
    const members = client.guilds.cache.reduce((sum, guild) => sum + (guild.memberCount ?? 0), 0);
    const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

    const embed = new EmbedBuilder()
      .setColor(COLORS.brand)
      .setAuthor({ name: client.user!.username, iconURL: client.user!.displayAvatarURL() })
      .setThumbnail(client.user!.displayAvatarURL({ size: 256 }))
      .setDescription(t('util.botInfoDescription'))
      .addFields(
        { name: `🏠 ${t('util.servers')}`, value: client.guilds.cache.size.toLocaleString('uz-UZ'), inline: true },
        { name: `👥 ${t('util.members')}`, value: members.toLocaleString('uz-UZ'), inline: true },
        { name: `⌨️ ${t('util.commands')}`, value: String(client.commands.size), inline: true },
        { name: `⏱️ ${t('util.uptime')}`, value: formatDuration(client.uptime ?? 0, 2), inline: true },
        { name: `📶 ${t('util.latencyWs')}`, value: `${Math.max(client.ws.ping, 0)} ms`, inline: true },
        { name: `🧠 ${t('util.memory')}`, value: `${memoryMb} MB`, inline: true },
        {
          name: `🔧 ${t('util.versions')}`,
          value: `UzCord **v${VERSION}** · discord.js **v${djsVersion}** · Node.js **${process.version}**`,
        }
      )
      .setFooter(brandFooter(t('util.botInfoFooter')))
      .setTimestamp();

    await interaction.reply({ embeds: [embed], components: [linkButtons(t, client.user!.id)] });
  },
});
