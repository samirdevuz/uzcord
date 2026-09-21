"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logger_1 = require("../core/logger");
const guilds_1 = require("../db/guilds");
const roles_1 = require("../db/roles");
const panel_1 = require("../modules/roles/panel");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
const permissions_1 = require("../utils/permissions");
const log = (0, logger_1.createLogger)('interaction');
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.InteractionCreate, async (client, interaction) => {
    // ── Rol tugmalari ─────────────────────────────────────────────────────────
    if (interaction.isButton()) {
        const roleId = (0, panel_1.roleIdFromCustomId)(interaction.customId);
        if (!roleId || !interaction.inCachedGuild())
            return;
        const settings = (0, guilds_1.getSettings)(interaction.guildId);
        const t = (0, i18n_1.createTranslator)(settings.locale);
        if (!(0, guilds_1.isModuleEnabled)(settings, 'roles')) {
            await interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)(t('error.moduleDisabled', { module: 'roles' }))],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // Tugma haqiqatan ham shu panelga tegishlimi?
        const panel = await (0, roles_1.getPanelRoles)(interaction.message.id);
        if (!panel.some((item) => item.role_id === roleId))
            return;
        const me = interaction.guild.members.me;
        if (!(0, permissions_1.canManageRole)(me, roleId)) {
            await interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)(t('roles.roleTooHigh'))],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const role = interaction.guild.roles.cache.get(roleId);
        try {
            if (interaction.member.roles.cache.has(roleId)) {
                await interaction.member.roles.remove(role, 'Rollar paneli');
                await interaction.reply({
                    content: t('roles.removed', { role: role.name }),
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
            }
            else {
                await interaction.member.roles.add(role, 'Rollar paneli');
                await interaction.reply({
                    content: t('roles.added', { role: role.name }),
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
            }
        }
        catch (error) {
            log.warn('Rol tugmasi ishlamadi:', error);
            await interaction
                .reply({ embeds: [(0, embeds_1.errorEmbed)(t('error.generic'))], flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(() => null);
        }
        return;
    }
    // ── Slash komandalar ──────────────────────────────────────────────────────
    if (!interaction.isChatInputCommand())
        return;
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        log.warn(`Noma'lum komanda: ${interaction.commandName}`);
        return;
    }
    const guildOnly = command.guildOnly !== false;
    if (guildOnly && !interaction.inGuild()) {
        await interaction.reply({
            embeds: [(0, embeds_1.errorEmbed)((0, i18n_1.createTranslator)('uz')('error.guildOnly'))],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return;
    }
    const settings = interaction.inGuild() ? (0, guilds_1.getSettings)(interaction.guildId) : (0, guilds_1.defaultSettings)();
    const t = (0, i18n_1.createTranslator)(settings.locale);
    // Modul o'chirilgan bo'lsa, moderatsiya komandalari ishlamaydi.
    if (command.category === 'moderation' && !(0, guilds_1.isModuleEnabled)(settings, 'moderation')) {
        await interaction.reply({
            embeds: [(0, embeds_1.errorEmbed)(t('error.moduleDisabled', { module: 'moderation' }))],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return;
    }
    // Kutish vaqti (cooldown)
    const cooldownSeconds = command.cooldown ?? 3;
    if (cooldownSeconds > 0) {
        if (!client.cooldowns.has(command.data.name)) {
            client.cooldowns.set(command.data.name, new discord_js_1.Collection());
        }
        const timestamps = client.cooldowns.get(command.data.name);
        const expiresAt = timestamps.get(interaction.user.id);
        if (expiresAt && Date.now() < expiresAt) {
            const remaining = ((expiresAt - Date.now()) / 1000).toFixed(1);
            await interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)(t('error.cooldown', { seconds: remaining }))],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        timestamps.set(interaction.user.id, Date.now() + cooldownSeconds * 1000);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownSeconds * 1000).unref();
    }
    // Botning ruxsatlari yetarlimi?
    if (command.botPermissions?.length && interaction.inGuild()) {
        const me = interaction.guild?.members.me;
        const missing = command.botPermissions.filter((permission) => !me?.permissions.has(permission));
        if (missing.length > 0) {
            const names = missing
                .map((permission) => new discord_js_1.PermissionsBitField(permission).toArray().join(', '))
                .join(', ');
            await interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)(t('error.botMissingPermission', { permissions: names }))],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
    }
    const ctx = { client, settings, t };
    try {
        await command.execute(interaction, ctx);
    }
    catch (error) {
        log.error(`/${interaction.commandName} xatolik berdi:`, error);
        const payload = {
            embeds: [(0, embeds_1.errorEmbed)(t('error.generic'), t('error.title'))],
            flags: discord_js_1.MessageFlags.Ephemeral,
        };
        try {
            if (interaction.deferred) {
                await interaction.editReply({ embeds: payload.embeds });
            }
            else if (interaction.replied) {
                await interaction.followUp(payload);
            }
            else {
                await interaction.reply(payload);
            }
        }
        catch {
            // Javob berish imkoni qolmadi.
        }
    }
});
//# sourceMappingURL=interactionCreate.js.map