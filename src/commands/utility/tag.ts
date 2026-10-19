import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { defineCommand } from '../../core/types';
import { createTag, deleteTag, getTag, incrementTagUses, listTags, updateTag } from '../../db/tags';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Maxsus server taglarini yaratish, foydalanish va boshqarish')
    .addSubcommand((sub) =>
      sub
        .setName('use')
        .setDescription('Tag mazmunini yuboradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Yangi tag yaratadi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true))
        .addStringOption((opt) => opt.setName('content').setDescription('Tag matni').setRequired(true))
        .addBooleanOption((opt) => opt.setName('embed').setDescription('Embed korinishida yuborilsinmi?'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Mavjud tagni tahrirlaydi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true))
        .addStringOption((opt) => opt.setName('content').setDescription('Yangi matn').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Tagni ochiradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Serverdagi barcha taglar royxati')
    ),
  category: 'utility',

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'use') {
      const name = interaction.options.getString('name', true).toLowerCase();
      const tag = await getTag(interaction.guild.id, name);

      if (!tag) {
        await interaction.reply({ content: `\`${name}\` nomli tag topilmadi.`, ephemeral: true });
        return;
      }

      await incrementTagUses(tag.id);

      if (tag.as_embed) {
        const embed = new EmbedBuilder()
          .setTitle(`📌 ${tag.name}`)
          .setDescription(tag.content)
          .setColor('#3b82f6')
          .setFooter({ text: `Ishlatildi: ${tag.uses + 1} marta` });

        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ content: tag.content });
      }
      return;
    }

    if (subcommand === 'create') {
      const name = interaction.options.getString('name', true).trim().toLowerCase();
      const content = interaction.options.getString('content', true);
      const asEmbed = interaction.options.getBoolean('embed') ?? false;

      const existing = await getTag(interaction.guild.id, name);
      if (existing) {
        await interaction.reply({ content: `\`${name}\` nomli tag allaqachon mavjud.`, ephemeral: true });
        return;
      }

      const created = await createTag({
        guild_id: interaction.guild.id,
        name,
        content,
        as_embed: asEmbed,
        created_by: interaction.user.id,
      });

      if (!created) {
        await interaction.reply({ content: "Tagni saqlab bo'lmadi.", ephemeral: true });
        return;
      }

      await interaction.reply({ content: `✅ Tag \`${name}\` yaratildi!`, ephemeral: true });
      return;
    }

    if (subcommand === 'edit') {
      const name = interaction.options.getString('name', true).trim().toLowerCase();
      const content = interaction.options.getString('content', true);

      const tag = await getTag(interaction.guild.id, name);
      if (!tag) {
        await interaction.reply({ content: `\`${name}\` nomli tag topilmadi.`, ephemeral: true });
        return;
      }

      if (tag.created_by !== interaction.user.id && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "Faqat tag muallifi yoki administrator uni tahrirlashi mumkin.", ephemeral: true });
        return;
      }

      await updateTag(interaction.guild.id, name, { content });
      await interaction.reply({ content: `✅ Tag \`${name}\` yangilandi!`, ephemeral: true });
      return;
    }

    if (subcommand === 'delete') {
      const name = interaction.options.getString('name', true).trim().toLowerCase();
      const tag = await getTag(interaction.guild.id, name);

      if (!tag) {
        await interaction.reply({ content: `\`${name}\` nomli tag topilmadi.`, ephemeral: true });
        return;
      }

      if (tag.created_by !== interaction.user.id && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "Faqat tag muallifi yoki administrator uni o'chirishi mumkin.", ephemeral: true });
        return;
      }

      await deleteTag(interaction.guild.id, name);
      await interaction.reply({ content: `✅ Tag \`${name}\` o'chirildi!`, ephemeral: true });
      return;
    }

    if (subcommand === 'list') {
      const tags = await listTags(interaction.guild.id);
      if (tags.length === 0) {
        await interaction.reply({ content: "Serverda hali taglar yaratilmagan.", ephemeral: true });
        return;
      }

      const names = tags.map((t) => `\`${t.name}\``).join(', ');
      const embed = new EmbedBuilder()
        .setTitle(`📌 ${interaction.guild.name} — Taglar (${tags.length} ta)`)
        .setDescription(names)
        .setColor('#3b82f6')
        .setFooter({ text: "Ishlatish uchun: /tag use name:<nom>" });

      await interaction.reply({ embeds: [embed] });
    }
  },
});
