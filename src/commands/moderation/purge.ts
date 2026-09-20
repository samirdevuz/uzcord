import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type Message,
  type TextChannel,
} from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';

const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription("Kanaldagi xabarlarni ommaviy o'chiradi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription("Nechta xabar tekshirilsin (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option.setName('user').setDescription("Faqat shu foydalanuvchining xabarlari")
    )
    .addStringOption((option) =>
      option.setName('contains').setDescription("Faqat shu matn bor xabarlar")
    )
    .addBooleanOption((option) =>
      option.setName('bots').setDescription("Faqat botlarning xabarlari")
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await reply(interaction, errorEmbed(t('error.channelType')), true);
      return;
    }

    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.options.getUser('user');
    const contains = interaction.options.getString('contains')?.toLowerCase();
    const botsOnly = interaction.options.getBoolean('bots');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const fetched = await (channel as TextChannel).messages.fetch({ limit: amount });
    const cutoff = Date.now() - TWO_WEEKS;

    const target = fetched.filter((message: Message) => {
      if (message.createdTimestamp < cutoff) return false;
      if (message.pinned) return false;
      if (user && message.author.id !== user.id) return false;
      if (botsOnly && !message.author.bot) return false;
      if (contains && !message.content.toLowerCase().includes(contains)) return false;
      return true;
    });

    if (target.size === 0) {
      await reply(interaction, errorEmbed(t('mod.purgeEmpty')));
      return;
    }

    try {
      const deleted = await (channel as TextChannel).bulkDelete(target, true);
      await reply(interaction, successEmbed(t('mod.purged', { count: deleted.size })));
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })));
    }
  },
});
