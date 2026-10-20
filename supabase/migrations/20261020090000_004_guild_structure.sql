-- ============================================================
--  UzCord — server tuzilmasi (kanallar va rollar) keshi
--  Bot har bir server uchun kanallar va rollar ro'yxatini shu
--  ustunlarga yozib turadi. Dashboard'da ID yozish o'rniga
--  ro'yxatdan tanlash uchun ishlatiladi (dashboard'da bot tokeni yo'q).
-- ============================================================

alter table public.guilds
  add column if not exists channels         jsonb       not null default '[]'::jsonb,
  add column if not exists roles            jsonb       not null default '[]'::jsonb,
  add column if not exists structure_synced timestamptz;

comment on column public.guilds.channels is
  'Bot sinxronlagan kanallar: [{id, name, type, parent_id, position}]';
comment on column public.guilds.roles is
  'Bot sinxronlagan rollar: [{id, name, color, position, managed}]';
