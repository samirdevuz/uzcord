"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTicketSettings = getTicketSettings;
exports.updateTicketSettings = updateTicketSettings;
exports.getNextTicketNumber = getNextTicketNumber;
exports.createTicket = createTicket;
exports.getOpenTicketsForUser = getOpenTicketsForUser;
exports.getTicketByChannel = getTicketByChannel;
exports.updateTicket = updateTicket;
const supabase_1 = require("./supabase");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('db:tickets');
async function getTicketSettings(guildId) {
    const { data, error } = await supabase_1.supabase
        .from('ticket_settings')
        .select('*')
        .eq('guild_id', guildId)
        .single();
    if (error || !data) {
        return {
            guild_id: guildId,
            enabled: false,
            category_id: null,
            transcript_channel_id: null,
            support_role_ids: [],
            panel_channel_id: null,
            panel_message_id: null,
            panel_title: 'Yordam kerakmi?',
            panel_description: 'Quyidagi tugmani bosib moderatorlarga murojaat qiling.',
            open_message: 'Salom {user}! Muammoingizni batafsil yozing, moderatorlar tez orada javob beradi.',
            max_open_per_user: 1,
            next_number: 1,
        };
    }
    return {
        ...data,
        support_role_ids: Array.isArray(data.support_role_ids) ? data.support_role_ids : [],
    };
}
async function updateTicketSettings(guildId, patch) {
    const { error } = await supabase_1.supabase
        .from('ticket_settings')
        .upsert({ guild_id: guildId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'guild_id' });
    if (error)
        log.error(`updateTicketSettings: ${error.message}`);
}
async function getNextTicketNumber(guildId) {
    const { data, error } = await supabase_1.supabase.rpc('next_ticket_number', { p_guild_id: guildId });
    if (error || data === null) {
        log.error(`getNextTicketNumber: ${error?.message}`);
        return 1;
    }
    return Number(data);
}
async function createTicket(ticket) {
    return (0, supabase_1.unwrap)(await supabase_1.supabase.from('tickets').insert(ticket).select().single(), 'createTicket');
}
async function getOpenTicketsForUser(guildId, openerId) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('tickets')
        .select('*')
        .eq('guild_id', guildId)
        .eq('opener_id', openerId)
        .neq('status', 'closed'), 'getOpenTicketsForUser');
}
async function getTicketByChannel(channelId) {
    const { data } = await supabase_1.supabase
        .from('tickets')
        .select('*')
        .eq('channel_id', channelId)
        .single();
    return data ? data : null;
}
async function updateTicket(id, patch) {
    const { error } = await supabase_1.supabase.from('tickets').update(patch).eq('id', id);
    if (error)
        log.error(`updateTicket: ${error.message}`);
}
//# sourceMappingURL=tickets.js.map