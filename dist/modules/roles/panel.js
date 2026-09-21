"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_BUTTONS = exports.BUTTON_PREFIX = void 0;
exports.customIdFor = customIdFor;
exports.roleIdFromCustomId = roleIdFromCustomId;
exports.buildComponents = buildComponents;
exports.refreshPanel = refreshPanel;
const discord_js_1 = require("discord.js");
exports.BUTTON_PREFIX = 'br';
exports.MAX_BUTTONS = 25;
function customIdFor(roleId) {
    return `${exports.BUTTON_PREFIX}:${roleId}`;
}
function roleIdFromCustomId(customId) {
    if (!customId.startsWith(`${exports.BUTTON_PREFIX}:`))
        return null;
    return customId.slice(exports.BUTTON_PREFIX.length + 1) || null;
}
/** Paneldagi rollardan tugmalar qatorini yasaydi (5 tadan, eng ko'pi 5 qator). */
function buildComponents(roles) {
    const rows = [];
    for (let index = 0; index < roles.length; index += 5) {
        const chunk = roles.slice(index, index + 5);
        const row = new discord_js_1.ActionRowBuilder();
        for (const role of chunk) {
            const button = new discord_js_1.ButtonBuilder()
                .setCustomId(customIdFor(role.role_id))
                .setLabel(role.label.slice(0, 80))
                .setStyle(discord_js_1.ButtonStyle.Secondary);
            if (role.emoji) {
                try {
                    button.setEmoji(role.emoji);
                }
                catch {
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
async function refreshPanel(message, roles) {
    await message.edit({ components: buildComponents(roles) });
}
//# sourceMappingURL=panel.js.map