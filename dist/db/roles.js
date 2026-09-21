"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addButtonRole = addButtonRole;
exports.getPanelRoles = getPanelRoles;
exports.removeButtonRole = removeButtonRole;
exports.isPanelMessage = isPanelMessage;
const logger_1 = require("../core/logger");
const supabase_1 = require("./supabase");
const log = (0, logger_1.createLogger)('db:roles');
async function addButtonRole(data) {
    const { error } = await supabase_1.supabase.from('button_roles').insert({
        guild_id: data.guild_id,
        channel_id: data.channel_id,
        message_id: data.message_id,
        role_id: data.role_id,
        label: data.label,
        emoji: data.emoji,
        position: data.position ?? 0,
    });
    if (error) {
        if (!error.message.includes('duplicate'))
            log.error(`addButtonRole: ${error.message}`);
        return false;
    }
    return true;
}
async function getPanelRoles(messageId) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('button_roles')
        .select('*')
        .eq('message_id', messageId)
        .order('id', { ascending: true }), `getPanelRoles(${messageId})`);
}
async function removeButtonRole(messageId, roleId) {
    const { data, error } = await supabase_1.supabase
        .from('button_roles')
        .delete()
        .eq('message_id', messageId)
        .eq('role_id', roleId)
        .select('id');
    if (error) {
        log.error(`removeButtonRole: ${error.message}`);
        return false;
    }
    return (data?.length ?? 0) > 0;
}
async function isPanelMessage(messageId) {
    const { count, error } = await supabase_1.supabase
        .from('button_roles')
        .select('id', { count: 'exact', head: true })
        .eq('message_id', messageId);
    if (error)
        return false;
    return (count ?? 0) > 0;
}
//# sourceMappingURL=roles.js.map