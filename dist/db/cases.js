"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCase = createCase;
exports.getCase = getCase;
exports.getUserCases = getUserCases;
exports.getActiveWarnings = getActiveWarnings;
exports.countActiveWarnings = countActiveWarnings;
exports.deactivateCase = deactivateCase;
exports.clearWarnings = clearWarnings;
exports.updateCaseReason = updateCaseReason;
exports.addTempAction = addTempAction;
exports.getExpiredActions = getExpiredActions;
exports.removeTempAction = removeTempAction;
exports.removeTempActionFor = removeTempActionFor;
const logger_1 = require("../core/logger");
const supabase_1 = require("./supabase");
const log = (0, logger_1.createLogger)('db:cases');
function mapCase(row) {
    return {
        ...row,
        created_at: (0, supabase_1.toMs)(row.created_at),
    };
}
/**
 * Yangi case yaratadi. Case raqami Postgres funksiyasi ichida,
 * advisory lock ostida beriladi — poyga holati bo'lmaydi.
 */
async function createCase(data) {
    const row = (0, supabase_1.unwrap)(await supabase_1.supabase.rpc('create_mod_case', {
        p_guild_id: data.guildId,
        p_type: data.type,
        p_user_id: data.userId,
        p_user_tag: data.userTag ?? null,
        p_moderator_id: data.moderatorId,
        p_moderator_tag: data.moderatorTag ?? null,
        p_reason: data.reason ?? null,
        p_duration_ms: data.durationMs ?? null,
    }), 'createCase');
    return row ? mapCase(row) : null;
}
async function getCase(guildId, caseNumber) {
    const { data, error } = await supabase_1.supabase
        .from('mod_cases')
        .select('*')
        .eq('guild_id', guildId)
        .eq('case_number', caseNumber)
        .maybeSingle();
    if (error) {
        log.error(`getCase: ${error.message}`);
        return null;
    }
    return data ? mapCase(data) : null;
}
async function getUserCases(guildId, userId, limit = 25) {
    const rows = (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('mod_cases')
        .select('*')
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .order('case_number', { ascending: false })
        .limit(limit), 'getUserCases');
    return rows.map(mapCase);
}
async function getActiveWarnings(guildId, userId) {
    const rows = (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('mod_cases')
        .select('*')
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .eq('type', 'warn')
        .eq('active', true)
        .order('case_number', { ascending: false }), 'getActiveWarnings');
    return rows.map(mapCase);
}
async function countActiveWarnings(guildId, userId) {
    const { count, error } = await supabase_1.supabase
        .from('mod_cases')
        .select('id', { count: 'exact', head: true })
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .eq('type', 'warn')
        .eq('active', true);
    if (error) {
        log.error(`countActiveWarnings: ${error.message}`);
        return 0;
    }
    return count ?? 0;
}
async function deactivateCase(guildId, caseNumber) {
    const { data, error } = await supabase_1.supabase
        .from('mod_cases')
        .update({ active: false })
        .eq('guild_id', guildId)
        .eq('case_number', caseNumber)
        .eq('active', true)
        .select('id');
    if (error) {
        log.error(`deactivateCase: ${error.message}`);
        return false;
    }
    return (data?.length ?? 0) > 0;
}
async function clearWarnings(guildId, userId) {
    const { data, error } = await supabase_1.supabase
        .from('mod_cases')
        .update({ active: false })
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .eq('type', 'warn')
        .eq('active', true)
        .select('id');
    if (error) {
        log.error(`clearWarnings: ${error.message}`);
        return 0;
    }
    return data?.length ?? 0;
}
async function updateCaseReason(guildId, caseNumber, reason) {
    const { data, error } = await supabase_1.supabase
        .from('mod_cases')
        .update({ reason })
        .eq('guild_id', guildId)
        .eq('case_number', caseNumber)
        .select('id');
    if (error) {
        log.error(`updateCaseReason: ${error.message}`);
        return false;
    }
    return (data?.length ?? 0) > 0;
}
// ── Vaqtinchalik jazolar ────────────────────────────────────────────────────
function mapTemp(row) {
    return {
        ...row,
        expires_at: (0, supabase_1.toMs)(row.expires_at),
        created_at: (0, supabase_1.toMs)(row.created_at),
    };
}
async function addTempAction(guildId, userId, type, expiresAt, caseNumber) {
    const { error } = await supabase_1.supabase.from('temp_actions').upsert({
        guild_id: guildId,
        user_id: userId,
        type,
        case_number: caseNumber,
        expires_at: (0, supabase_1.toIso)(expiresAt),
    }, { onConflict: 'guild_id,user_id,type' });
    if (error)
        log.error(`addTempAction: ${error.message}`);
}
async function getExpiredActions(at = Date.now()) {
    const rows = (0, supabase_1.unwrapList)(await supabase_1.supabase.from('temp_actions').select('*').lte('expires_at', (0, supabase_1.toIso)(at)), 'getExpiredActions');
    return rows.map(mapTemp);
}
async function removeTempAction(id) {
    const { error } = await supabase_1.supabase.from('temp_actions').delete().eq('id', id);
    if (error)
        log.error(`removeTempAction: ${error.message}`);
}
async function removeTempActionFor(guildId, userId, type) {
    const { error } = await supabase_1.supabase
        .from('temp_actions')
        .delete()
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .eq('type', type);
    if (error)
        log.error(`removeTempActionFor: ${error.message}`);
}
//# sourceMappingURL=cases.js.map