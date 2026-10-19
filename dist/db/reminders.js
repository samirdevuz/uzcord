"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReminder = createReminder;
exports.getDueReminders = getDueReminders;
exports.markReminderDelivered = markReminderDelivered;
exports.getUserReminders = getUserReminders;
exports.deleteReminder = deleteReminder;
const supabase_1 = require("./supabase");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('db:reminders');
async function createReminder(reminder) {
    return (0, supabase_1.unwrap)(await supabase_1.supabase.from('reminders').insert(reminder).select().single(), 'createReminder');
}
async function getDueReminders() {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('reminders')
        .select('*')
        .eq('delivered', false)
        .lte('remind_at', new Date().toISOString()), 'getDueReminders');
}
async function markReminderDelivered(id) {
    const { error } = await supabase_1.supabase
        .from('reminders')
        .update({ delivered: true })
        .eq('id', id);
    if (error)
        log.error(`markReminderDelivered: ${error.message}`);
}
async function getUserReminders(userId) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('delivered', false)
        .order('remind_at', { ascending: true }), 'getUserReminders');
}
async function deleteReminder(id, userId) {
    const { error, count } = await supabase_1.supabase
        .from('reminders')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId);
    if (error) {
        log.error(`deleteReminder: ${error.message}`);
        return false;
    }
    return (count ?? 0) > 0;
}
//# sourceMappingURL=reminders.js.map