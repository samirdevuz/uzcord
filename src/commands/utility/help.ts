import { SlashCommandBuilder } from 'discord.js';
import { defineCommand, type CommandCategory } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { brandEmbed, errorEmbed, truncate } from '../../utils/embeds';

const CATEGORY_ICONS: Record<CommandCategory, string> = {
  moderation: '🛡️',
  config: '⚙️',
  utility: '🧰',
};

export default defineCommand({
  category: 'utility',
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription("Barcha komandalar ro'yxatini ko'rsatadi")
    .addStringOption((option) =>
      option.setName('command').setDescription("Bitta komanda haqida batafsil")
    ),

  async execute(interaction, ctx) {
    const { t, client } = ctx;
    const requested = interaction.options.getString('command')?.toLowerCase().replace(/^\//, '');

    if (requested) {
      const command = client.commands.get(requested);
      if (!command) {
        await reply(interaction, errorEmbed(t('util.helpNotFound')), true);
        return;
      }

      const json = command.data.toJSON();
      const embed = brandEmbed(`/${json.name}`, json.description);

      const options = json.options ?? [];
      if (options.length > 0) {
        embed.addFields({
          name: 'Parametrlar / sub-komandalar',
          value: truncate(
            options.map((option) => `\`${option.name}\` — ${option.description}`).join('\n'),
            1000
          ),
        });
      }

      embed.addFields({
        name: 'Kategoriya',
        value: `${CATEGORY_ICONS[command.category]} ${command.category}`,
        inline: true,
      });

      await reply(interaction, embed, true);
      return;
    }

    const embed = brandEmbed(t('util.helpTitle'), t('util.helpDescription'));
    const categories: CommandCategory[] = ['moderation', 'config', 'utility'];
    const labels: Record<CommandCategory, string> = {
      moderation: t('util.helpCategoryModeration'),
      config: t('util.helpCategoryConfig'),
      utility: t('util.helpCategoryUtility'),
    };

    for (const category of categories) {
      const names = client.commands
        .filter((command) => command.category === category)
        .map((command) => `\`/${command.data.name}\``)
        .sort();

      if (names.length === 0) continue;

      embed.addFields({
        name: `${CATEGORY_ICONS[category]} ${labels[category]} (${names.length})`,
        value: truncate(names.join(' '), 1000),
      });
    }

    await reply(interaction, embed, true);
  },
});
