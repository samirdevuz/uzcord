# UzCord Dashboard

UzCord botining veb boshqaruv paneli. Next.js 15 (App Router) + Supabase.

> Manzil: [uzcord.samirdev.uz](https://uzcord.samirdev.uz)

---

## Nima qiladi

| Sahifa | Imkoniyat |
|---|---|
| `/` | Landing — bot haqida, Discord bilan kirish |
| `/dashboard` | Siz boshqara oladigan serverlar ro'yxati |
| `/dashboard/[id]` | Statistika + modullarni yoqish/o'chirish |
| `/dashboard/[id]/settings` | Til, log kanallari, kutib olish, avtomatik rol |
| `/dashboard/[id]/automod` | 9 ta AutoMod qoidasi, chegaralar, jazo, taqiqlangan so'zlar |
| `/dashboard/[id]/cases` | Moderatsiya tarixi — filtr va sahifalash bilan |
| `/dashboard/[id]/leveling` | Leveling sozlamalari va reyting |

---

## Arxitektura qarorlari

**1. To'liq server-rendered, JavaScript'siz.**
Barcha formalar oddiy HTML `<form>` — React hooklari ishlatilmaydi. Natijada:
sahifalar bir zumda ochiladi, client/server chegarasi xatolari umuman bo'lmaydi,
va panel JavaScript o'chirilgan brauzerda ham ishlaydi.

**2. Ruxsat tekshiruvi qo'lda, RLS emas.**
Dashboard Supabase'ga `service_role` kaliti bilan kiradi — bu kalit RLS ni
chetlab o'tadi. Shuning uchun **har bir sahifa va har bir server action**
`requireGuildAccess()` yoki `assertGuildAccess()` dan boshlanadi. Bu funksiya
foydalanuvchining sessiyasidagi serverlar ro'yxatini tekshiradi.

Sessiyadagi ro'yxat Discord OAuth orqali olinadi: `/users/@me/guilds` dan
faqat `MANAGE_GUILD` yoki `ADMINISTRATOR` ruxsati bor serverlar saqlanadi.

**3. Sessiya — imzolangan cookie, bazasiz.**
HMAC-SHA256 bilan imzolangan JSON, `httpOnly` cookie ichida, 7 kun.
Bazaga sessiya yozilmaydi — ortiqcha jadval va so'rovlar kerak emas.

---

## Lokal ishga tushirish

```bash
cd dashboard
npm install
cp .env.example .env.local     # keyin qiymatlarni to'ldiring
npm run dev
```

`http://localhost:3000` da ochiladi.

### .env.local ni to'ldirish

| O'zgaruvchi | Qayerdan olinadi |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Lokal uchun `http://localhost:3000` |
| `DISCORD_CLIENT_ID` | Developer Portal → General Information → Application ID |
| `DISCORD_CLIENT_SECRET` | Developer Portal → OAuth2 → Client Secret → **Reset Secret** |
| `SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |

### Discord OAuth redirect URI

Developer Portal → **OAuth2** → **Redirects** bo'limiga qo'shing:

```
http://localhost:3000/api/auth/callback
https://uzcord.samirdev.uz/api/auth/callback
```

Ikkalasini ham qo'shing — biri lokal ishlash uchun, ikkinchisi productionda.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ni **hech qachon** `NEXT_PUBLIC_` prefiksi bilan
> yozmang. Bu kalit butun bazaga to'liq kirish beradi.

---

## Vercel'ga deploy qilish

1. [vercel.com/new](https://vercel.com/new) → GitHub repoingizni tanlang
2. **Root Directory**: `dashboard` ni ko'rsating (repo ildizida bot turadi)
3. **Environment Variables** ga yuqoridagi barcha qiymatlarni qo'shing
   (`NEXT_PUBLIC_APP_URL` = `https://uzcord.samirdev.uz`)
4. **Deploy** bosing

### Subdomenni ulash

1. Vercel → loyiha → **Settings → Domains** → `uzcord.samirdev.uz` qo'shing
2. Vercel sizga CNAME qiymatini beradi (odatda `cname.vercel-dns.com`)
3. Cloudflare → `samirdev.uz` → **DNS → Add record**:

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | CNAME | `uzcord` | `cname.vercel-dns.com` | **DNS only** (kulrang bulut) |

> ⚠️ Cloudflare proxy (to'q sariq bulut) **o'chiq** bo'lishi kerak — aks holda
> Vercel SSL sertifikatini bera olmaydi. Sertifikat chiqqandan keyin xohlasangiz
> proxy'ni yoqishingiz mumkin.

---

## Loyiha tuzilishi

```
dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # landing
│   │   ├── privacy/ terms/       # huquqiy sahifalar
│   │   ├── api/auth/             # Discord OAuth (login, callback, logout)
│   │   └── dashboard/
│   │       ├── page.tsx          # server tanlash
│   │       └── [guildId]/        # sozlamalar sahifalari
│   ├── lib/
│   │   ├── env.ts                # muhit o'zgaruvchilari
│   │   ├── session.ts            # HMAC imzolangan cookie
│   │   ├── discord.ts            # OAuth + Discord API
│   │   ├── guard.ts              # ruxsat tekshiruvi
│   │   ├── supabase.ts           # service_role klienti
│   │   └── actions.ts            # server actionlar (formalar)
│   └── components/ui.tsx         # Card, Field, Toggle, ...
└── tailwind.config.ts
```

## Yangi sozlama sahifasi qo'shish

1. `src/lib/actions.ts` ga server action yozing — `assertGuildAccess()` dan boshlang
2. `src/app/dashboard/[guildId]/<nom>/page.tsx` yarating
3. `src/app/dashboard/[guildId]/layout.tsx` dagi `NAV` massiviga qo'shing
