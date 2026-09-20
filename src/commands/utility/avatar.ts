import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { brandEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'utility',
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Foydalanuvchining avatarini ko'rsatadi")
    .addUserOption((option) =>
      option.setName('user').setDescription("Foydalanuvchi (bo'sh = o'zingiz)")
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const user = interaction.options.getUser('user') ?? interaction.user;
    const url = user.displayAvatarURL({ size: 1024 });

    const embed = brandEmbed(t('util.avatarTitle', { user: user.tag }))
      .setImage(url)
      .setDescription(`[PNG](${user.displayAvatarURL({ extension: 'png', size: 1024 })}) · [WEBP](${user.displayAvatarURL({ extension: 'webp', size: 1024 })})`);

    await reply(interaction, embed);
  },
});
