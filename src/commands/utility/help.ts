import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { buildCommandDetail, buildHelpHome } from '../../modules/help';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'utility',
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription("Komandalar bo'yicha qo'llanma")
    .addStringOption((option) =>
      option.setName('command').setDescription('Bitta komanda haqida batafsil').setAutocomplete(true)
    ),

  async autocomplete(interaction, ctx) {
    const focused = interaction.options.getFocused().toLowerCase().replace(/^\//, '');
    const names = [...ctx.client.commands.keys()].filter((name) => name.includes(focused)).sort().slice(0, 25);
    await interaction.respond(names.map((name) => ({ name: `/${name}`, value: name })));
  },

  async execute(interaction, ctx) {
    const { t, client } = ctx;
    const requested = interaction.options.getString('command')?.toLowerCase().replace(/^\//, '');

    if (requested) {
      const command = client.commands.get(requested);
      if (!command) {
        await reply(interaction, errorEmbed(t('util.helpNotFound')), true);
        return;
      }
      await interaction.reply({ embeds: [buildCommandDetail(command, t)], flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.reply({ ...buildHelpHome(client, t), flags: MessageFlags.Ephemeral });
  },
});
