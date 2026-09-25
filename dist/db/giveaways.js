"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGiveaway = createGiveaway;
exports.getGiveawayByMessage = getGiveawayByMessage;
exports.getDueGiveaways = getDueGiveaways;
exports.addGiveawayEntry = addGiveawayEntry;
exports.getGiveawayEntries = getGiveawayEntries;
exports.endGiveaway = endGiveaway;
const supabase_1 = require("./supabase");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('db:giveaways');
async function createGiveaway(giveaway) {
    return (0, supabase_1.unwrap)(await supabase_1.supabase.from('giveaways').insert(giveaway).select().single(), 'createGiveaway');
}
async function getGiveawayByMessage(messageId) {
    const { data } = await supabase_1.supabase
        .from('giveaways')
        .select('*')
        .eq('message_id', messageId)
        .single();
    return data ? data : null;
}
async function getDueGiveaways() {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('giveaways')
        .select('*')
        .eq('ended', false)
        .lte('ends_at', new Date().toISOString()), 'getDueGiveaways');
}
async function addGiveawayEntry(giveawayId, userId) {
    const { error } = await supabase_1.supabase
        .from('giveaway_entries')
        .insert({ giveaway_id: giveawayId, user_id: userId });
    if (error) {
        if (!error.message.includes('duplicate')) {
            log.error(`addGiveawayEntry: ${error.message}`);
        }
        return false;
    }
    return true;
}
async function getGiveawayEntries(giveawayId) {
    const rows = (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('giveaway_entries')
        .select('user_id')
        .eq('giveaway_id', giveawayId), 'getGiveawayEntries');
    return rows.map((r) => r.user_id);
}
async function endGiveaway(id, winners) {
    const { error } = await supabase_1.supabase
        .from('giveaways')
        .update({ ended: true, winners })
        .eq('id', id);
    if (error)
        log.error(`endGiveaway: ${error.message}`);
}
//# sourceMappingURL=giveaways.js.map