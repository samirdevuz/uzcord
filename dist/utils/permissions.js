"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARGET_ERROR_KEYS = void 0;
exports.canTarget = canTarget;
exports.missingPermissions = missingPermissions;
exports.canManageRole = canManageRole;
const discord_js_1 = require("discord.js");
/**
 * Moderator berilgan a'zoga nisbatan amal bajara oladimi?
 * Rol ierarxiyasi va maxsus holatlarni tekshiradi.
 */
function canTarget(executor, target, me) {
    if (executor.id === target.id)
        return 'self';
    if (target.id === me.id)
        return 'bot';
    if (target.id === target.guild.ownerId)
        return 'owner';
    // Server egasi hammaga ta'sir qila oladi.
    if (executor.id !== executor.guild.ownerId) {
        if (executor.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
            return 'hierarchy';
        }
    }
    if (me.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
        return 'botHierarchy';
    }
    return 'ok';
}
exports.TARGET_ERROR_KEYS = {
    self: 'error.selfTarget',
    bot: 'error.botTarget',
    owner: 'error.ownerTarget',
    hierarchy: 'error.hierarchy',
    botHierarchy: 'error.botHierarchy',
};
/** Botda yetishmayotgan ruxsatlar ro'yxatini o'qishga qulay ko'rinishda qaytaradi. */
function missingPermissions(me, required) {
    const missing = required.filter((permission) => !me.permissions.has(permission));
    return missing.map((permission) => new discord_js_1.PermissionsBitField(permission).toArray().join(', '));
}
/** Bot berilgan rolni bera/olib tashlay oladimi? */
function canManageRole(me, roleId) {
    const role = me.guild.roles.cache.get(roleId);
    if (!role)
        return false;
    if (role.managed)
        return false;
    if (role.id === me.guild.roles.everyone.id)
        return false;
    return me.roles.highest.comparePositionTo(role) > 0;
}
//# sourceMappingURL=permissions.js.map