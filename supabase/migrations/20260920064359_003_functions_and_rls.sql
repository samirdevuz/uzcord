-- ============================================================
--  UzCord V2 — yordamchi funksiyalar va xavfsizlik (RLS)
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Server yozuvi borligiga ishonch hosil qiladi
create or replace function public.ensure_guild(p_guild_id text)
returns public.guilds
language plpgsql
security definer
set search_path = public
as $$
declare g public.guilds;
begin
  insert into public.guilds (guild_id) values (p_guild_id)
    on conflict (guild_id) do nothing;
  select * into g from public.guilds where guild_id = p_guild_id;
  return g;
end;
$$;

-- Case raqamini atomik tarzda beradi (poyga holatisiz)
create or replace function public.create_mod_case(
  p_guild_id      text,
  p_type          text,
  p_user_id       text,
  p_user_tag      text,
  p_moderator_id  text,
  p_moderator_tag text,
  p_reason        text,
  p_duration_ms   bigint
)
returns public.mod_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number integer;
  v_case   public.mod_cases;
begin
  perform pg_advisory_xact_lock(hashtext('uzcord:case:' || p_guild_id));

  insert into public.guilds (guild_id) values (p_guild_id)
    on conflict (guild_id) do nothing;

  select coalesce(max(case_number), 0) + 1 into v_number
    from public.mod_cases where guild_id = p_guild_id;

  insert into public.mod_cases
    (guild_id, case_number, type, user_id, user_tag,
     moderator_id, moderator_tag, reason, duration_ms)
  values
    (p_guild_id, v_number, p_type, p_user_id, p_user_tag,
     p_moderator_id, p_moderator_tag, p_reason, p_duration_ms)
  returning * into v_case;

  return v_case;
end;
$$;

-- Umumiy XP dan darajani hisoblaydi (Mee6 formulasi:
-- n-darajadan n+1 ga o'tish uchun 5n^2 + 50n + 100 XP kerak)
create or replace function public.level_from_xp(total_xp bigint)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  lvl       integer := 0;
  needed    bigint  := 100;
  remaining bigint  := greatest(coalesce(total_xp, 0), 0);
begin
  while remaining >= needed and lvl < 1000 loop
    remaining := remaining - needed;
    lvl := lvl + 1;
    needed := 5 * lvl * lvl + 50 * lvl + 100;
  end loop;
  return lvl;
end;
$$;

-- Berilgan darajaga yetish uchun kerakli umumiy XP
create or replace function public.xp_for_level(target_level integer)
returns bigint
language plpgsql
immutable
set search_path = public
as $$
declare
  total bigint := 0;
  n     integer := 0;
begin
  while n < greatest(coalesce(target_level, 0), 0) loop
    total := total + (5 * n * n + 50 * n + 100);
    n := n + 1;
  end loop;
  return total;
end;
$$;

-- XP qo'shadi va yangi/eski darajani qaytaradi
create or replace function public.add_member_xp(
  p_guild_id text,
  p_user_id  text,
  p_user_tag text,
  p_avatar   text,
  p_amount   integer
)
returns table (xp bigint, level integer, old_level integer, messages bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_level integer;
  v_xp        bigint;
  v_level     integer;
  v_messages  bigint;
begin
  insert into public.guilds (guild_id) values (p_guild_id)
    on conflict (guild_id) do nothing;

  insert into public.member_levels (guild_id, user_id, user_tag, avatar)
  values (p_guild_id, p_user_id, p_user_tag, p_avatar)
  on conflict (guild_id, user_id) do nothing;

  select ml.level into v_old_level
    from public.member_levels ml
   where ml.guild_id = p_guild_id and ml.user_id = p_user_id;

  update public.member_levels ml
     set xp              = ml.xp + p_amount,
         messages        = ml.messages + 1,
         user_tag        = coalesce(p_user_tag, ml.user_tag),
         avatar          = coalesce(p_avatar, ml.avatar),
         last_message_at = now(),
         level           = public.level_from_xp(ml.xp + p_amount)
   where ml.guild_id = p_guild_id and ml.user_id = p_user_id
   returning ml.xp, ml.level, ml.messages
   into v_xp, v_level, v_messages;

  return query select v_xp, v_level, v_old_level, v_messages;
end;
$$;

-- Ticket raqamini atomik beradi
create or replace function public.next_ticket_number(p_guild_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v integer;
begin
  perform pg_advisory_xact_lock(hashtext('uzcord:ticket:' || p_guild_id));

  insert into public.guilds (guild_id) values (p_guild_id)
    on conflict (guild_id) do nothing;
  insert into public.ticket_settings (guild_id) values (p_guild_id)
    on conflict (guild_id) do nothing;

  update public.ticket_settings
     set next_number = next_number + 1
   where guild_id = p_guild_id
   returning next_number - 1 into v;

  return v;
end;
$$;

-- Foydalanuvchining serverdagi o'rni (leaderboard uchun)
create or replace function public.member_rank(p_guild_id text, p_user_id text)
returns integer
language sql
stable
set search_path = public
as $$
  select count(*)::integer + 1
    from public.member_levels
   where guild_id = p_guild_id
     and xp > coalesce(
       (select xp from public.member_levels
         where guild_id = p_guild_id and user_id = p_user_id), -1);
$$;

-- ============================================================
--  RLS — barcha jadvallar yopiq.
--  Faqat service_role (bot va dashboard serveri) kira oladi;
--  anon/authenticated kalitlar hech narsani ko'ra olmaydi.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'guilds','mod_cases','temp_actions','escalations','automod_settings',
    'filtered_words','button_roles','ticket_settings','tickets',
    'level_settings','member_levels','level_rewards','giveaways',
    'giveaway_entries','reminders','starboard_settings','starboard_posts',
    'tags','polls','poll_votes','dashboard_audit'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;

-- SECURITY DEFINER funksiyalar faqat server tomonidan chaqiriladi
revoke all on function public.ensure_guild(text)        from public, anon, authenticated;
revoke all on function public.create_mod_case(text, text, text, text, text, text, text, bigint)
  from public, anon, authenticated;
revoke all on function public.add_member_xp(text, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.next_ticket_number(text)  from public, anon, authenticated;
