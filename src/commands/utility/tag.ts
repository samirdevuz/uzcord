import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { createTag, deleteTag, getTag, incrementTagUses, listTags, searchTagNames, updateTag } from '../../db/tags';
import { reply } from '../../modules/moderation/actions';
import { COLORS, errorEmbed, successEmbed, truncate } from '../../utils/embeds';
import { normalizeTagName } from '../../utils/validation';

export default defineCommand({
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Server taglari — tez-tez yuboriladigan matnlar')
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('use')
        .setDescription('Tagni yuboradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true).setAutocomplete(true))
        .addUserOption((opt) => opt.setName('user').setDescription('Kimga qaratilgan (eslatib o\'tiladi)'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Yangi tag yaratadi')
        .addStringOption((opt) => opt.setName('name').setDescription('Nomi (harf, raqam, - va _)').setRequired(true).setMaxLength(32))
        .addStringOption((opt) => opt.setName('content').setDescription('Matni').setRequired(true).setMaxLength(2000))
        .addBooleanOption((opt) => opt.setName('embed').setDescription('Embed ko\'rinishida yuborilsinmi?'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Tag matnini o\'zgartiradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true).setAutocomplete(true))
        .addStringOption((opt) => opt.setName('content').setDescription('Yangi matn').setRequired(true).setMaxLength(2000))
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Tagni o\'chiradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true).setAutocomplete(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('Barcha taglar')),

  async autocomplete(interaction) {
    if (!interaction.guildId) return;
    const focused = interaction.options.getFocused();
    const names = await searchTagNames(interaction.guildId, focused);
    await interaction.respond(names.map((name) => ({ name, value: name })));
  },

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const tags = await listTags(guild.id);
      if (tags.length === 0) {
        await reply(interaction, errorEmbed(t('tag.listEmpty')), true);
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`📌 ${t('tag.listTitle', { count: tags.length })}`)
        .setDescription(truncate(tags.map((tag) => `\`${tag.name}\` · ${tag.uses}`).join('\n'), 4000))
        .setFooter({ text: t('tag.listFooter') });
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const name = normalizeTagName(interaction.options.getString('name', true));
    if (!name) {
      await reply(interaction, errorEmbed(t('tag.invalidName')), true);
      return;
    }

    if (subcommand === 'create') {
      if (await getTag(guild.id, name)) {
        await reply(interaction, errorEmbed(t('tag.exists', { name })), true);
        return;
      }
      const created = await createTag({
        guild_id: guild.id,
        name,
        content: interaction.options.getString('content', true),
        as_embed: interaction.options.getBoolean('embed') ?? false,
        created_by: interaction.user.id,
      });
      await reply(interaction, created ? successEmbed(t('tag.created', { name })) : errorEmbed(t('tag.saveFailed')), true);
      return;
    }

    const tag = await getTag(guild.id, name);
    if (!tag) {
      await reply(interaction, errorEmbed(t('tag.notFound', { name })), true);
      return;
    }

    if (subcommand === 'use') {
      await incrementTagUses(tag.id);
      const target = interaction.options.getUser('user');
      const mention = target ? `<@${target.id}>` : undefined;
      const allowedMentions = { users: target ? [target.id] : [] };
      if (tag.as_embed) {
        const embed = new EmbedBuilder().setColor(COLORS.info).setTitle(`📌 ${tag.name}`).setDescription(tag.content);
        await interaction.reply({ content: mention, embeds: [embed], allowedMentions });
      } else {
        await interaction.reply({ content: mention ? `${mention}\n${tag.content}` : tag.content, allowedMentions });
      }
      return;
    }

    const canManage =
      tag.created_by === interaction.user.id || interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    if (!canManage) {
      await reply(interaction, errorEmbed(t('tag.noPermission')), true);
      return;
    }

    if (subcommand === 'edit') {
      const ok = await updateTag(guild.id, name, { content: interaction.options.getString('content', true) });
      await reply(interaction, ok ? successEmbed(t('tag.updated', { name })) : errorEmbed(t('tag.saveFailed')), true);
      return;
    }

    await deleteTag(guild.id, name);
    await reply(interaction, successEmbed(t('tag.deleted', { name })), true);
  },
});
