"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStarboardSettings = getStarboardSettings;
exports.updateStarboardSettings = updateStarboardSettings;
exports.getStarboardPost = getStarboardPost;
exports.saveStarboardPost = saveStarboardPost;
exports.deleteStarboardPost = deleteStarboardPost;
const supabase_1 = require("./supabase");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('db:starboard');
async function getStarboardSettings(guildId) {
    const { data, error } = await supabase_1.supabase
        .from('starboard_settings')
        .select('*')
        .eq('guild_id', guildId)
        .single();
    if (error || !data) {
        return {
            guild_id: guildId,
            enabled: false,
            channel_id: null,
            emoji: '⭐',
            threshold: 3,
            allow_self_star: false,
            ignored_channels: [],
        };
    }
    return {
        ...data,
        ignored_channels: Array.isArray(data.ignored_channels) ? data.ignored_channels : [],
    };
}
async function updateStarboardSettings(guildId, patch) {
    const { error } = await supabase_1.supabase
        .from('starboard_settings')
        .upsert({ guild_id: guildId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'guild_id' });
    if (error)
        log.error(`updateStarboardSettings: ${error.message}`);
}
async function getStarboardPost(guildId, sourceMessageId) {
    const { data } = await supabase_1.supabase
        .from('starboard_posts')
        .select('*')
        .eq('guild_id', guildId)
        .eq('source_message_id', sourceMessageId)
        .single();
    return data ? data : null;
}
async function saveStarboardPost(post) {
    const { error } = await supabase_1.supabase
        .from('starboard_posts')
        .upsert(post, { onConflict: 'guild_id,source_message_id' });
    if (error)
        log.error(`saveStarboardPost: ${error.message}`);
}
async function deleteStarboardPost(guildId, sourceMessageId) {
    const { error } = await supabase_1.supabase
        .from('starboard_posts')
        .delete()
        .eq('guild_id', guildId)
        .eq('source_message_id', sourceMessageId);
    if (error)
        log.error(`deleteStarboardPost: ${error.message}`);
}
//# sourceMappingURL=starboard.js.map