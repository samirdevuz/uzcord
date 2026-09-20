# Supabase sxemasi

Bu papkada UzCord bazasining to'liq sxemasi SQL ko'rinishida saqlanadi.
Fayllar Supabase'da allaqachon qo'yilgan — bu yerda ular **tarix va
yangi loyihaga qayta o'rnatish uchun** turadi.

## Yangi loyihaga o'rnatish

Supabase Dashboard → **SQL Editor** → fayllarni **tartib bilan** ishga tushiring:

1. `20260920064217_001_core_schema.sql` — serverlar, caselar, automod, rollar
2. `20260920064306_002_v2_features.sql` — ticket, leveling, giveaway, starboard, tag, so'rovnoma
3. `20260920064359_003_functions_and_rls.sql` — funksiyalar va xavfsizlik

Yoki Supabase CLI bilan:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## Xavfsizlik modeli

Barcha jadvallarda **RLS yoqilgan, lekin birorta siyosat yo'q**. Bu ataylab:

- `anon` va `authenticated` kalitlar hech narsani ko'ra olmaydi
- faqat `service_role` kaliti kiradi (u RLS ni chetlab o'tadi)
- `service_role` faqat serverda ishlatiladi: bot va dashboard backendida

Dashboard'da ruxsat tekshiruvi **qo'lda** bajariladi (`src/lib/guard.ts`):
har bir sahifa va server action foydalanuvchining Discord sessiyasidagi
serverlar ro'yxatini tekshiradi.

## Jadvallar

| Jadval | Nima uchun |
|---|---|
| `guilds` | Server sozlamalari (til, log kanallari, kutib olish, modullar) |
| `mod_cases` | Moderatsiya tarixi — har bir jazo bitta case |
| `temp_actions` | Muddati tugaydigan jazolar (vaqtinchalik ban) |
| `escalations` | Ogohlantirishlar soniga qarab avtomatik jazo |
| `automod_settings` · `filtered_words` | AutoMod qoidalari va taqiqlangan so'zlar |
| `button_roles` | Tugmali rol panellari |
| `ticket_settings` · `tickets` | Murojaat tizimi |
| `level_settings` · `member_levels` · `level_rewards` | XP va darajalar |
| `giveaways` · `giveaway_entries` | Konkurslar |
| `reminders` | Eslatmalar |
| `starboard_settings` · `starboard_posts` | Starboard |
| `tags` | Maxsus komandalar / avtojavoblar |
| `polls` · `poll_votes` | So'rovnomalar |
| `dashboard_audit` | Panel orqali kiritilgan o'zgarishlar jurnali |

## Funksiyalar

| Funksiya | Nima qiladi |
|---|---|
| `create_mod_case(...)` | Case yaratadi, raqamni advisory lock ostida beradi |
| `ensure_guild(id)` | Server yozuvi borligiga ishonch hosil qiladi |
| `add_member_xp(...)` | XP qo'shadi, yangi va eski darajani qaytaradi |
| `level_from_xp(xp)` · `xp_for_level(n)` | Daraja ↔ XP hisoblash (Mee6 formulasi) |
| `next_ticket_number(id)` | Ticket raqamini atomik beradi |
| `member_rank(guild, user)` | Reytingdagi o'rin |
