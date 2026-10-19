"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevelSettings = getLevelSettings;
exports.updateLevelSettings = updateLevelSettings;
exports.getMemberLevel = getMemberLevel;
exports.addXp = addXp;
exports.getLeaderboard = getLeaderboard;
exports.getMemberRank = getMemberRank;
exports.getLevelRewards = getLevelRewards;
exports.setLevelReward = setLevelReward;
exports.removeLevelReward = removeLevelReward;
const supabase_1 = require("./supabase");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('db:leveling');
async function getLevelSettings(guildId) {
    const { data, error } = await supabase_1.supabase
        .from('level_settings')
        .select('*')
        .eq('guild_id', guildId)
        .single();
    if (error || !data) {
        return {
            guild_id: guildId,
            enabled: false,
            xp_min: 15,
            xp_max: 25,
            cooldown_seconds: 60,
            multiplier: 1.0,
            announce_enabled: true,
            announce_channel_id: null,
            level_up_message: 'Tabriklaymiz {user}, siz **{level}**-darajaga yetdingiz!',
            ignored_channels: [],
            no_xp_roles: [],
            stack_rewards: true,
        };
    }
    return {
        ...data,
        ignored_channels: Array.isArray(data.ignored_channels) ? data.ignored_channels : [],
        no_xp_roles: Array.isArray(data.no_xp_roles) ? data.no_xp_roles : [],
    };
}
async function updateLevelSettings(guildId, patch) {
    const { error } = await supabase_1.supabase
        .from('level_settings')
        .upsert({ guild_id: guildId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'guild_id' });
    if (error)
        log.error(`updateLevelSettings: ${error.message}`);
}
async function getMemberLevel(guildId, userId) {
    const { data } = await supabase_1.supabase
        .from('member_levels')
        .select('*')
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .single();
    return data ? data : null;
}
async function addXp(guildId, userId, userTag, avatar, amount) {
    const { data, error } = await supabase_1.supabase.rpc('add_member_xp', {
        p_guild_id: guildId,
        p_user_id: userId,
        p_user_tag: userTag,
        p_avatar: avatar,
        p_amount: amount,
    });
    if (error || !data || data.length === 0) {
        if (error)
            log.error(`addXp: ${error.message}`);
        return null;
    }
    const row = data[0];
    return {
        xp: Number(row.xp),
        level: Number(row.level),
        oldLevel: Number(row.old_level),
        messages: Number(row.messages),
    };
}
async function getLeaderboard(guildId, limit = 10) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('member_levels')
        .select('*')
        .eq('guild_id', guildId)
        .order('xp', { ascending: false })
        .limit(limit), 'getLeaderboard');
}
async function getMemberRank(guildId, userId) {
    const { data, error } = await supabase_1.supabase.rpc('member_rank', {
        p_guild_id: guildId,
        p_user_id: userId,
    });
    if (error || data === null)
        return 0;
    return Number(data);
}
async function getLevelRewards(guildId) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('level_rewards')
        .select('*')
        .eq('guild_id', guildId)
        .order('level', { ascending: true }), 'getLevelRewards');
}
async function setLevelReward(guildId, level, roleId) {
    const { error } = await supabase_1.supabase
        .from('level_rewards')
        .upsert({ guild_id: guildId, level, role_id: roleId }, { onConflict: 'guild_id,level' });
    if (error)
        log.error(`setLevelReward: ${error.message}`);
}
async function removeLevelReward(guildId, level) {
    const { error } = await supabase_1.supabase
        .from('level_rewards')
        .delete()
        .eq('guild_id', guildId)
        .eq('level', level);
    if (error)
        log.error(`removeLevelReward: ${error.message}`);
}
//# sourceMappingURL=leveling.js.map