import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  StringSelectMenuBuilder,
  type APIApplicationCommandOption,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { config } from '../../core/config';
import type { UzCordClient } from '../../core/client';
import type { Command, CommandCategory } from '../../core/types';
import { getSettings } from '../../db/guilds';
import { createTranslator, type TranslationKey, type Translator } from '../../i18n';
import { brandFooter, COLORS, truncate } from '../../utils/embeds';

export const HELP_SELECT = 'help:category';

export const CATEGORIES: { id: CommandCategory; icon: string; label: TranslationKey; blurb: TranslationKey }[] = [
  { id: 'moderation', icon: '🛡️', label: 'util.helpCategoryModeration', blurb: 'util.helpBlurbModeration' },
  { id: 'config', icon: '⚙️', label: 'util.helpCategoryConfig', blurb: 'util.helpBlurbConfig' },
  { id: 'community', icon: '🎉', label: 'util.helpCategoryCommunity', blurb: 'util.helpBlurbCommunity' },
  { id: 'music', icon: '🎵', label: 'util.helpCategoryMusic', blurb: 'util.helpBlurbMusic' },
  { id: 'utility', icon: '🧰', label: 'util.helpCategoryUtility', blurb: 'util.helpBlurbUtility' },
];

/** Botning barcha modullari uchun kerakli ruxsatlar. */
const INVITE_PERMISSIONS = new PermissionsBitField([
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageNicknames,
  PermissionFlagsBits.ManageThreads,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.MoveMembers,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
]).bitfield;

/** Bot taklif havolasi — kerakli ruxsatlar bilan. */
export function inviteUrl(clientId: string): string {
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot+applications.commands&permissions=${INVITE_PERMISSIONS}`;
}

export function linkButtons(t: Translator, clientId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('util.helpDashboard')).setEmoji('🖥️').setURL(config.dashboardUrl),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('util.helpInvite')).setEmoji('➕').setURL(inviteUrl(clientId)),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('util.helpSupport')).setEmoji('💬').setURL(config.supportUrl)
  );
}

function categoryMenu(t: Translator, client: UzCordClient, selected?: CommandCategory): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(HELP_SELECT)
    .setPlaceholder(t('util.helpPlaceholder'))
    .addOptions(
      { label: t('util.helpHome'), value: 'home', emoji: '🏠', default: !selected },
      ...CATEGORIES.map((category) => ({
        label: t(category.label),
        description: t('util.helpCommandCount', { count: commandsIn(client, category.id).length }),
        value: category.id,
        emoji: category.icon,
        default: selected === category.id,
      }))
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function commandsIn(client: UzCordClient, category: CommandCategory): Command[] {
  return [...client.commands.values()]
    .filter((command) => command.category === category)
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
}

function subcommandNames(command: Command): string[] {
  const options = (command.data.toJSON().options ?? []) as APIApplicationCommandOption[];
  return options
    .filter((option) => option.type === ApplicationCommandOptionType.Subcommand)
    .map((option) => option.name);
}

export function buildHelpHome(client: UzCordClient, t: Translator) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setAuthor({ name: t('util.helpTitle'), iconURL: client.user?.displayAvatarURL() })
    .setDescription(t('util.helpIntro', { count: client.commands.size }))
    .setThumbnail(client.user?.displayAvatarURL({ size: 256 }) ?? null)
    .setFooter(brandFooter(t('util.helpDescription')));

  for (const category of CATEGORIES) {
    const count = commandsIn(client, category.id).length;
    if (count === 0) continue;
    embed.addFields({ name: `${category.icon} ${t(category.label)} · ${count}`, value: t(category.blurb), inline: true });
  }

  return { embeds: [embed], components: [categoryMenu(t, client), linkButtons(t, client.user!.id)] };
}

export function buildHelpCategory(client: UzCordClient, t: Translator, categoryId: CommandCategory) {
  const category = CATEGORIES.find((item) => item.id === categoryId)!;
  const lines = commandsIn(client, categoryId).map((command) => {
    const json = command.data.toJSON();
    const subs = subcommandNames(command);
    const subLine = subs.length > 0 ? `\n  ↳ ${subs.map((name) => `\`${name}\``).join(' · ')}` : '';
    return `**\`/${json.name}\`** — ${json.description}${subLine}`;
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle(`${category.icon} ${t(category.label)}`)
    .setDescription(truncate(`${t(category.blurb)}\n\n${lines.join('\n')}`, 4000))
    .setFooter(brandFooter(t('util.helpDescription')));

  return { embeds: [embed], components: [categoryMenu(t, client, categoryId), linkButtons(t, client.user!.id)] };
}

/** Bitta komanda haqida batafsil: subkomandalar va parametrlar. */
export function buildCommandDetail(command: Command, t: Translator): EmbedBuilder {
  const json = command.data.toJSON();
  const category = CATEGORIES.find((item) => item.id === command.category);
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle(`/${json.name}`)
    .setDescription(json.description)
    .setFooter(brandFooter());

  const options = (json.options ?? []) as APIApplicationCommandOption[];
  const describe = (option: APIApplicationCommandOption): string => {
    const required = 'required' in option && option.required ? '' : '?';
    return `\`${option.name}${required}\` — ${option.description}`;
  };

  const subs = options.filter((option) => option.type === ApplicationCommandOptionType.Subcommand);
  if (subs.length > 0) {
    embed.addFields({
      name: t('util.helpSubcommands'),
      value: truncate(
        subs
          .map((sub) => {
            const params = ('options' in sub && sub.options ? sub.options : []) as APIApplicationCommandOption[];
            const signature = params.map((param) => ('required' in param && param.required ? `<${param.name}>` : `[${param.name}]`)).join(' ');
            return `**\`/${json.name} ${sub.name}${signature ? ` ${signature}` : ''}\`**\n${sub.description}`;
          })
          .join('\n'),
        1024
      ),
    });
  } else if (options.length > 0) {
    embed.addFields({ name: t('util.helpOptions'), value: truncate(options.map(describe).join('\n'), 1024) });
  }

  if (category) embed.addFields({ name: t('util.helpCategory'), value: `${category.icon} ${t(category.label)}`, inline: true });
  if (command.cooldown) embed.addFields({ name: t('util.helpCooldown'), value: `${command.cooldown}s`, inline: true });
  return embed;
}

export async function handleHelpSelect(interaction: StringSelectMenuInteraction): Promise<boolean> {
  if (interaction.customId !== HELP_SELECT) return false;
  const client = interaction.client as UzCordClient;
  const t = createTranslator(interaction.guildId ? getSettings(interaction.guildId).locale : config.defaultLocale);
  const value = interaction.values[0];
  const view =
    value === 'home' || !CATEGORIES.some((category) => category.id === value)
      ? buildHelpHome(client, t)
      : buildHelpCategory(client, t, value as CommandCategory);
  await interaction.update(view);
  return true;
}
