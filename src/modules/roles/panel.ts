import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Message,
} from 'discord.js';
import type { ButtonRole } from '../../db/roles';

export const BUTTON_PREFIX = 'br';
export const MAX_BUTTONS = 25;

export function customIdFor(roleId: string): string {
  return `${BUTTON_PREFIX}:${roleId}`;
}

export function roleIdFromCustomId(customId: string): string | null {
  if (!customId.startsWith(`${BUTTON_PREFIX}:`)) return null;
  return customId.slice(BUTTON_PREFIX.length + 1) || null;
}

/** Paneldagi rollardan tugmalar qatorini yasaydi (5 tadan, eng ko'pi 5 qator). */
export function buildComponents(roles: ButtonRole[]): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let index = 0; index < roles.length; index += 5) {
    const chunk = roles.slice(index, index + 5);
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const role of chunk) {
      const button = new ButtonBuilder()
        .setCustomId(customIdFor(role.role_id))
        .setLabel(role.label.slice(0, 80))
        .setStyle(ButtonStyle.Secondary);
      if (role.emoji) {
        try {
          button.setEmoji(role.emoji);
        } catch {
          // Noto'g'ri emoji — tugma emojisiz qoladi.
        }
      }
      row.addComponents(button);
    }
    rows.push(row);
  }
  return rows.slice(0, 5);
}

/** Panel xabarining tugmalarini yangilaydi. */
export async function refreshPanel(message: Message, roles: ButtonRole[]): Promise<void> {
  await message.edit({ components: buildComponents(roles) });
}
