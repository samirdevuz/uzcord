# UzCord V2 Database Documentation

## Tables & Schemas
- `guilds`: Primary server configuration and module toggles.
- `mod_cases`: Moderation cases (warn, timeout, kick, ban).
- `temp_actions`: Temporary moderation actions with expiration timestamps.
- `ticket_settings` & `tickets`: Ticket channels, categories, and support roles.
- `level_settings`, `member_levels`, `level_rewards`: Mee6-compatible leveling and role rewards.
- `giveaways` & `giveaway_entries`: Restart-safe giveaways and entrant tracking.
- `reminders`: Personal and channel reminder job queue.
- `starboard_settings` & `starboard_posts`: Starboard channels and message tracking.
- `tags`: Guild-specific custom commands and responses.
- `polls` & `poll_votes`: Time-bound polls and voting options.
- `dashboard_audit`: Administrative audit log for web actions.
