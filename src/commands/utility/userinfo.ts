import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, type UserFlagsString } from 'discord.js';
import { defineCommand } from '../../core/types';
import { countActiveWarnings } from '../../db/cases';
import { brandEmbed, truncate } from '../../utils/embeds';

const BADGES: Partial<Record<UserFlagsString, string>> = {
  Staff: '👨‍💼 Discord Staff',
  Partner: '🤝 Partner',
  Hypesquad: '🎪 HypeSquad Events',
  HypeSquadOnlineHouse1: '🟣 Bravery',
  HypeSquadOnlineHouse2: '🟠 Brilliance',
  HypeSquadOnlineHouse3: '🟢 Balance',
  BugHunterLevel1: '🐛 Bug Hunter',
  BugHunterLevel2: '🐞 Bug Hunter Gold',
  PremiumEarlySupporter: '💎 Early Supporter',
  VerifiedDeveloper: '🧑‍💻 Verified Developer',
  ActiveDeveloper: '⚙️ Active Developer',
  CertifiedModerator: '🛡️ Moderator Alumni',
  VerifiedBot: '✅ Verified Bot',
};
import { fullDate, relative } from '../../utils/time';

export default defineCommand({
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription("Foydalanuvchi haqida ma'lumot beradi")
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Foydalanuvchi (bo'sh = o'zingiz)")
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const target = interaction.options.getUser('user') ?? interaction.user;
    // force: true — banner va nishonlar faqat to'liq profil so'ralganda keladi.
    const user = await interaction.client.users.fetch(target.id, { force: true }).catch(() => target);
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);

    const embed = brandEmbed(t('util.userInfoTitle', { user: user.tag }))
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: `\`${user.id}\``, inline: true },
        { name: t('util.bot'), value: user.bot ? '✅' : '❌', inline: true },
        { name: t('util.createdAt'), value: `${fullDate(user.createdTimestamp)}\n${relative(user.createdTimestamp)}`, inline: true }
      );

    const badges = (user.flags?.toArray() ?? []).map((flag) => BADGES[flag]).filter(Boolean);
    if (badges.length > 0) embed.addFields({ name: t('util.badges'), value: badges.join('\n') });
    if (user.bannerURL()) embed.setImage(user.bannerURL({ size: 1024 })!);
    if (user.accentColor) embed.setColor(user.accentColor);

    if (member) {
      const roles = member.roles.cache
        .filter((role) => role.id !== interaction.guildId)
        .sort((a, b) => b.position - a.position)
        .map((role) => `<@&${role.id}>`);

      embed.addFields(
        {
          name: t('util.nickname'),
          value: member.nickname ?? t('common.none'),
          inline: true,
        },
        {
          name: t('log.joinedAt'),
          value: member.joinedTimestamp ? fullDate(member.joinedTimestamp) : t('common.none'),
          inline: true,
        },
        {
          name: t('util.highestRole'),
          value: `<@&${member.roles.highest.id}>`,
          inline: true,
        },
        {
          name: `${t('util.roles')} (${roles.length})`,
          value: roles.length > 0 ? truncate(roles.join(' '), 1000) : t('common.none'),
        }
      );

      if (member.communicationDisabledUntilTimestamp) {
        embed.addFields({
          name: t('util.timedOutUntil'),
          value: relative(member.communicationDisabledUntilTimestamp),
          inline: true,
        });
      }

      const warnings = await countActiveWarnings(interaction.guildId!, user.id);
      if (warnings > 0) {
        embed.addFields({ name: '⚠️ Ogohlantirishlar', value: String(warnings), inline: true });
      }
    }

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('util.avatar')).setURL(user.displayAvatarURL({ size: 4096 }))
    );
    const banner = user.bannerURL({ size: 4096 });
    if (banner) buttons.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('util.banner')).setURL(banner));

    await interaction.reply({ embeds: [embed], components: [buttons] });
  },
});
