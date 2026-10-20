"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTag = getTag;
exports.createTag = createTag;
exports.updateTag = updateTag;
exports.deleteTag = deleteTag;
exports.incrementTagUses = incrementTagUses;
exports.searchTagNames = searchTagNames;
exports.listTags = listTags;
const supabase_1 = require("./supabase");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('db:tags');
async function getTag(guildId, name) {
    const { data } = await supabase_1.supabase
        .from('tags')
        .select('*')
        .eq('guild_id', guildId)
        .eq('name', name.toLowerCase())
        .single();
    return data ? data : null;
}
async function createTag(tag) {
    return (0, supabase_1.unwrap)(await supabase_1.supabase.from('tags').insert(tag).select().single(), 'createTag');
}
async function updateTag(guildId, name, patch) {
    const { error } = await supabase_1.supabase
        .from('tags')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('guild_id', guildId)
        .eq('name', name.toLowerCase());
    if (error) {
        log.error(`updateTag: ${error.message}`);
        return false;
    }
    return true;
}
async function deleteTag(guildId, name) {
    const { error, count } = await supabase_1.supabase
        .from('tags')
        .delete({ count: 'exact' })
        .eq('guild_id', guildId)
        .eq('name', name.toLowerCase());
    if (error) {
        log.error(`deleteTag: ${error.message}`);
        return false;
    }
    return (count ?? 0) > 0;
}
async function incrementTagUses(id) {
    const { data } = await supabase_1.supabase.from('tags').select('uses').eq('id', id).single();
    if (data) {
        await supabase_1.supabase.from('tags').update({ uses: Number(data.uses) + 1 }).eq('id', id);
    }
}
/** Autocomplete uchun: nomi shu matndan boshlanadigan taglar. */
async function searchTagNames(guildId, prefix, limit = 25) {
    // LIKE maxsus belgilari (% _ \) foydalanuvchi matnida wildcard bo'lib qolmasin.
    const safe = prefix.toLowerCase().replace(/[%_\\]/g, '');
    const { data } = await supabase_1.supabase
        .from('tags')
        .select('name')
        .eq('guild_id', guildId)
        .like('name', `${safe}%`)
        .order('uses', { ascending: false })
        .limit(limit);
    return (data ?? []).map((row) => String(row.name));
}
async function listTags(guildId) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('tags')
        .select('*')
        .eq('guild_id', guildId)
        .order('name', { ascending: true }), 'listTags');
}
//# sourceMappingURL=tags.js.map