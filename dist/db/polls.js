"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPoll = createPoll;
exports.getPollByMessage = getPollByMessage;
exports.getDuePolls = getDuePolls;
exports.castPollVote = castPollVote;
exports.getPollVotes = getPollVotes;
exports.endPoll = endPoll;
const supabase_1 = require("./supabase");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('db:polls');
async function createPoll(poll) {
    return (0, supabase_1.unwrap)(await supabase_1.supabase.from('polls').insert(poll).select().single(), 'createPoll');
}
async function getPollByMessage(messageId) {
    const { data } = await supabase_1.supabase
        .from('polls')
        .select('*')
        .eq('message_id', messageId)
        .single();
    return data ? data : null;
}
async function getDuePolls() {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('polls')
        .select('*')
        .eq('ended', false)
        .not('ends_at', 'is', null)
        .lte('ends_at', new Date().toISOString()), 'getDuePolls');
}
async function castPollVote(pollId, userId, optionKey, multi) {
    if (!multi) {
        // Remove existing vote for single choice
        await supabase_1.supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', userId);
    }
    const { error } = await supabase_1.supabase
        .from('poll_votes')
        .upsert({ poll_id: pollId, user_id: userId, option_key: optionKey }, { onConflict: 'poll_id,user_id,option_key' });
    if (error) {
        log.error(`castPollVote: ${error.message}`);
        return false;
    }
    return true;
}
async function getPollVotes(pollId) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId), 'getPollVotes');
}
async function endPoll(id) {
    const { error } = await supabase_1.supabase
        .from('polls')
        .update({ ended: true })
        .eq('id', id);
    if (error)
        log.error(`endPoll: ${error.message}`);
}
//# sourceMappingURL=polls.js.map