import {
  PermissionsBitField,
  type GuildMember,
  type PermissionResolvable,
} from 'discord.js';

export type TargetCheck =
  | 'ok'
  | 'self'
  | 'bot'
  | 'owner'
  | 'hierarchy'
  | 'botHierarchy';

/**
 * Moderator berilgan a'zoga nisbatan amal bajara oladimi?
 * Rol ierarxiyasi va maxsus holatlarni tekshiradi.
 */
export function canTarget(
  executor: GuildMember,
  target: GuildMember,
  me: GuildMember
): TargetCheck {
  if (executor.id === target.id) return 'self';
  if (target.id === me.id) return 'bot';
  if (target.id === target.guild.ownerId) return 'owner';

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

export const TARGET_ERROR_KEYS = {
  self: 'error.selfTarget',
  bot: 'error.botTarget',
  owner: 'error.ownerTarget',
  hierarchy: 'error.hierarchy',
  botHierarchy: 'error.botHierarchy',
} as const;

/** Botda yetishmayotgan ruxsatlar ro'yxatini o'qishga qulay ko'rinishda qaytaradi. */
export function missingPermissions(
  me: GuildMember,
  required: PermissionResolvable[]
): string[] {
  const missing = required.filter((permission) => !me.permissions.has(permission));
  return missing.map((permission) => new PermissionsBitField(permission).toArray().join(', '));
}

/** Bot berilgan rolni bera/olib tashlay oladimi? */
export function canManageRole(me: GuildMember, roleId: string): boolean {
  const role = me.guild.roles.cache.get(roleId);
  if (!role) return false;
  if (role.managed) return false;
  if (role.id === me.guild.roles.everyone.id) return false;
  return me.roles.highest.comparePositionTo(role) > 0;
}
