# Hissa qo'shish

UzCord ochiq loyiha — har qanday yordam qadrlanadi.

## Qanday boshlash

Loyiha ikki qismdan iborat: **bot** (repo ildizida) va **dashboard**
(`dashboard/` papkasida). Ularning har birining o'z `package.json` va `.env` fayli bor.

```bash
git clone https://github.com/samirdevuz/uzcord.git
cd uzcord

# Bot
npm install
cp .env.example .env          # token va Supabase kalitlarini yozing
npm run dev

# Dashboard (alohida terminalda)
cd dashboard
npm install
cp .env.example .env.local
npm run dev
```

Sinov uchun o'zingizning alohida Supabase loyihangizni yarating va
`supabase/migrations/` dagi SQL fayllarni tartib bilan ishga tushiring.

## Qoidalar

1. **Branch:** `main` ga to'g'ridan-to'g'ri push qilmang. `feat/nom` yoki `fix/nom` branch oching.
2. **Commit:** [Conventional Commits](https://www.conventionalcommits.org) uslubida yozing —
   `feat: tugmali rollar qo'shildi`, `fix: timeout muddati noto'g'ri hisoblanardi`.
3. **Tekshirish:** PR ochishdan oldin ikkalasida ham `npm run typecheck`
   xatosiz o'tsin (botda va `dashboard/` ichida).
4. **Til:** komanda tavsiflari va foydalanuvchiga ko'rinadigan matnlar o'zbekcha.
   Kod izohlari ham o'zbekcha bo'lgani ma'qul.

## Tarjima qo'shish

`src/i18n/ru.ts` va `src/i18n/en.ts` hozircha qisman to'ldirilgan.
Yetishmayotgan kalitlarni `src/i18n/uz.ts` dan olib to'ldirsangiz — juda foydali bo'ladi.
Tarjima topilmasa, bot avtomatik o'zbekchaga qaytadi, shuning uchun qisman
to'ldirish ham xavfsiz.

## Yangi komanda qo'shish

`src/commands/<kategoriya>/<nom>.ts` fayl yarating va `defineCommand({...})` ni
default export qiling. Ro'yxatga olish shart emas — registry avtomatik topadi.

## Baza sxemasini o'zgartirish

Jadval qo'shish yoki o'zgartirish kerak bo'lsa:

1. `supabase/migrations/` ga yangi SQL fayl qo'shing (eskilarini tahrirlamang)
2. Yangi jadvalda **RLS ni yoqing** — siyosatlar yozmang (`service_role` yetarli)
3. `src/db/types.ts` ga TypeScript tipini qo'shing
4. Kerak bo'lsa `src/db/` ga repozitoriy funksiyalarini yozing

## Nima keshlanadi

Bot server sozlamalarini, AutoMod qoidalarini va taqiqlangan so'zlarni
xotirada saqlaydi (`src/db/cache.ts`) — chunki ular har bir xabarda o'qiladi.
Agar yangi "issiq" ma'lumot qo'shsangiz, uni ham keshga qo'shing. Qolgan
hamma narsa to'g'ridan-to'g'ri Supabase'dan o'qiladi.
