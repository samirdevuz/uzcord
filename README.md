<div align="center">

# UzCord

**O'zbek Discord serverlari uchun moderatsiya boti va boshqaruv paneli**

Carl-bot va Dyno o'rnini bosa oladigan, to'liq o'zbek tilidagi ochiq kodli bot.

[uzcord.samirdev.uz](https://uzcord.samirdev.uz) · [Discord serveri](https://discord.gg/JGfWtj3ydt)

</div>

---

## Mundarija

1. [Nima qiladi](#nima-qiladi)
2. [Loyiha tuzilishi](#loyiha-tuzilishi)
3. [Talablar](#talablar)
4. [1-qadam — Node.js o'rnatish](#1-qadam--nodejs-ornatish)
5. [2-qadam — Loyihani yuklab olish](#2-qadam--loyihani-yuklab-olish)
6. [3-qadam — Discord Developer Portal](#3-qadam--discord-developer-portal)
7. [4-qadam — Supabase](#4-qadam--supabase)
8. [5-qadam — .env faylini to'ldirish](#5-qadam--env-faylini-toldirish)
9. [6-qadam — Botni ishga tushirish](#6-qadam--botni-ishga-tushirish)
10. [7-qadam — Botni serverga taklif qilish](#7-qadam--botni-serverga-taklif-qilish)
11. [8-qadam — Dashboard](#8-qadam--dashboard)
12. [V1 dan V2 ga o'tish](#v1-dan-v2-ga-otish)
13. [Komandalar ro'yxati](#komandalar-royxati)
14. [AutoMod qanday ishlaydi](#automod-qanday-ishlaydi)
15. [Botni doimiy ishlatish](#botni-doimiy-ishlatish)
16. [Tez-tez uchraydigan xatoliklar](#tez-tez-uchraydigan-xatoliklar)
17. [Xavfsizlik qoidalari](#xavfsizlik-qoidalari)
18. [Keyingi bosqichlar](#keyingi-bosqichlar)

---

## Nima qiladi

| Modul | Imkoniyatlar |
|---|---|
| **Moderatsiya** | ban, vaqtinchalik ban, unban, kick, timeout, ogohlantirish, case tizimi, tarix |
| **AutoMod** | spam, takroriy xabar, taklif havolalari, tashqi havolalar, mention toshqini, CAPS, emoji toshqini, taqiqlangan so'zlar, reyd himoyasi |
| **Loglar** | xabar o'chirish/tahrirlash, a'zo kirish/chiqish, rol o'zgarishlari, ban, ovozli kanallar |
| **Kutib olish** | xush kelibsiz / xayrlashuv xabarlari, avtomatik rol |
| **Rollar** | tugma orqali rol olish panellari |
| **Dashboard** | veb orqali sozlash, moderatsiya tarixi, statistika |

Qo'shimcha:

- **Ko'p tillilik** — o'zbek (to'liq), rus va ingliz (qisman). Har bir server o'z tilini tanlaydi.
- **Ko'p serverli** — bitta bot istalgancha serverda ishlaydi, har birining sozlamasi alohida.
- **Avtomatik jazo** — masalan, 3-ogohlantirishda timeout, 5-da ban.

---

## Loyiha tuzilishi

Bu **bitta repozitoriyda ikkita ilova**:

```
uzcord/
├── src/                  ← Discord boti (Node.js + discord.js)
├── dashboard/            ← Veb panel (Next.js) — o'z package.json'i bor
├── supabase/migrations/  ← Baza sxemasi (SQL)
├── scripts/              ← Yordamchi skriptlar
└── docs/                 ← Maxfiylik siyosati, shartlar
```

### Arxitektura

```
   ┌──────────────┐        ┌──────────────┐
   │  Discord bot │        │   Dashboard  │
   │  (VPS/uyda)  │        │  (Vercel'da) │
   └──────┬───────┘        └──────┬───────┘
          │    service_role kaliti │
          └────────────┬───────────┘
                       ▼
              ┌─────────────────┐
              │    Supabase     │
              │   (Postgres)    │
              └─────────────────┘
```

**Muhim nuqta:** AutoMod **har bir xabarda** server sozlamalarini o'qiydi. Agar har safar
Supabase'ga so'rov ketsa, bot sezilarli sekinlashadi. Shuning uchun issiq ma'lumotlar
(server sozlamalari, AutoMod qoidalari, taqiqlangan so'zlar) **botning xotirasida
keshlanadi** va har daqiqada yangilanadi. Dashboard'da kiritilgan o'zgarish botga
eng ko'pi bilan 1 daqiqada yetadi (`CACHE_REFRESH_MS` bilan sozlanadi).

---

## Talablar

| Nima | Versiya | Izoh |
|---|---|---|
| Node.js | 20 yoki undan yuqori | Majburiy |
| Supabase akkaunt | free reja yetarli | Majburiy |
| Git | ixtiyoriy | Kodni yuklab olish uchun qulay |

---

## 1-qadam — Node.js o'rnatish

### Windows

1. [nodejs.org](https://nodejs.org) → **LTS** tugmasini bosing va faylni yuklab oling.
2. Faylni ishga tushiring, hamma joyda **Next** bosing.
3. **PowerShell** ni oching va tekshiring:

```powershell
node -v
npm -v
```

`v20.11.0` kabi raqam chiqsa — hammasi joyida.

### macOS / Linux

```bash
# macOS
brew install node@20

# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 2-qadam — Loyihani yuklab olish

```bash
git clone https://github.com/samirdevuz/uzcord.git
cd uzcord
npm install
```

> **Git yo'qmi?** GitHub sahifasidagi **Code → Download ZIP** tugmasini bosing.

---

## 3-qadam — Discord Developer Portal

[discord.com/developers/applications](https://discord.com/developers/applications) → **UzCord** ilovasini oching.

### 3.1. Bot tokenini oling

**Bot** bo'limi → **Reset Token** → **Yes, do it!** → chiqqan matnni nusxalang.

> ⚠️ **Token — bu botning paroli.** Hech kimga bermang, GitHub'ga yuklamang.
> Oshkor bo'lsa — darhol **Reset Token** bosing.

### 3.2. Privileged Intents — MAJBURIY

Xuddi shu **Bot** sahifasida **Privileged Gateway Intents** bo'limini toping va yoqing:

- ✅ **SERVER MEMBERS INTENT**
- ✅ **MESSAGE CONTENT INTENT**

**Save Changes** bosing. Yoqilmasa bot `Used disallowed intents` xatosini beradi.

### 3.3. Client Secret (dashboard uchun)

**OAuth2** → **Client Secret** → **Reset Secret** → nusxalang. Bu dashboard'ga kerak bo'ladi.

### 3.4. OAuth2 Redirect URI (dashboard uchun)

**OAuth2** → **Redirects** → ikkita manzil qo'shing:

```
http://localhost:3000/api/auth/callback
https://uzcord.samirdev.uz/api/auth/callback
```

### 3.5. Taklif havolasini yasash

**OAuth2 → URL Generator**:

1. **Scopes**: ✅ `bot` va ✅ `applications.commands`
2. **Bot Permissions**:

| Ruxsat | Nima uchun |
|---|---|
| View Channels · Send Messages · Embed Links | Asosiy ishlash |
| Read Message History | `/purge` uchun |
| Add Reactions · Use External Emojis | Reaksiyalar va emojilar |
| Manage Messages | Xabar o'chirish, AutoMod |
| Manage Channels | `/lock`, `/slowmode` |
| Manage Roles | Avtomatik rol, tugmali rollar |
| Kick Members · Ban Members · Moderate Members | `/kick`, `/ban`, `/timeout` |
| View Audit Log | Ban loglarida kim qilganini ko'rish |

> ❌ **Administrator** ruxsatini bermang.

3. Pastdagi **Generated URL** ni saqlab qo'ying.

---

## 4-qadam — Supabase

Bot va dashboard bitta Supabase bazasidan foydalanadi.

### 4.1. Loyihani oching

[supabase.com/dashboard](https://supabase.com/dashboard) → `uzcord` loyihasi.

Agar loyiha hali yo'q bo'lsa: **New project** → nom `uzcord`, region **Frankfurt (eu-central-1)**,
reja **Free**.

### 4.2. Sxemani qo'ying

Loyiha yangi bo'lsa, `supabase/migrations/` papkasidagi 3 ta SQL faylni **tartib bilan**
ishga tushiring: Supabase → **SQL Editor** → faylni nusxalab qo'ying → **Run**.

```
001_core_schema.sql        ← serverlar, caselar, automod, rollar
002_v2_features.sql        ← ticket, leveling, giveaway, starboard, ...
003_functions_and_rls.sql  ← funksiyalar va xavfsizlik
```

### 4.3. Kalitlarni oling

**Project Settings → Data API**:

| Kerak | Qayerda |
|---|---|
| Project URL | `https://xxxxx.supabase.co` |
| `service_role` kaliti | **API Keys** bo'limi → `service_role` (secret) |

> ⚠️ `service_role` kaliti **butun bazaga to'liq kirish** beradi va RLS ni chetlab o'tadi.
> U faqat serverda (bot va dashboard backendida) ishlatiladi. Hech qachon brauzerga
> chiqmasin.

---

## 5-qadam — .env faylini to'ldirish

```bash
# Windows PowerShell
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

`.env` ni matn muharririda oching:

```ini
DISCORD_TOKEN=3.1-bosqichdagi_token
CLIENT_ID=1551057441750257664
DEV_GUILD_ID=sinov_serveringiz_IDsi
OWNER_IDS=sizning_discord_IDingiz

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=4.3-bosqichdagi_service_role_kaliti
CACHE_REFRESH_MS=60000

DEFAULT_LOCALE=uz
LOG_LEVEL=info
```

### ID ni qanday olish kerak?

1. Discord → **Settings → Advanced → Developer Mode** ni yoqing.
2. Server yoki foydalanuvchi ustiga **o'ng tugma** → **Copy Server ID** / **Copy User ID**.

> **DEV_GUILD_ID** — sinov uchun alohida server yarating. To'ldirilgan bo'lsa komandalar
> **bir zumda** paydo bo'ladi. Bo'sh qoldirilsa global yuklanadi, bu **1 soatgacha** vaqt oladi.

---

## 6-qadam — Botni ishga tushirish

```bash
npm run deploy    # slash komandalarni Discord'ga yuklash
npm run dev       # botni ishga tushirish
```

Hammasi to'g'ri bo'lsa:

```
2026-09-20 10:00:00 INFO  [uzcord:supabase] Supabase ulandi: https://xxxxx.supabase.co
2026-09-20 10:00:01 INFO  [uzcord:cache] Kesh har 60s da yangilanadi.
2026-09-20 10:00:01 INFO  [uzcord:db] Baza tayyor.
2026-09-20 10:00:02 INFO  [uzcord:registry] 22 ta komanda yuklandi.
2026-09-20 10:00:02 INFO  [uzcord:registry] 13 ta event ulandi.
2026-09-20 10:00:04 INFO  [uzcord:ready] UzCord#3471 tizimga kirdi.
```

To'xtatish: **Ctrl + C**.

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish rejimi — kod o'zgarsa avtomatik qayta yuklanadi |
| `npm run build` | TypeScript → JavaScript (`dist/`) |
| `npm start` | Build qilingan versiyani ishga tushiradi |
| `npm run deploy` | Slash komandalarni Discord'ga yuklaydi |
| `npm run typecheck` | Tip xatolarini tekshiradi |
| `npm run migrate:sqlite` | V1 (SQLite) ma'lumotlarini Supabase'ga ko'chiradi |

---

## 7-qadam — Botni serverga taklif qilish

3.5-bosqichdagi havolani oching, serverni tanlang, **Authorize** bosing.

### Rol tartibini to'g'rilang — juda muhim

**Settings → Roles** → **UzCord** rolini yuqoriga suring:

```
👑 Server egasi
🤖 UzCord        ← shu yerda yoki yuqoriroqda
🛡️ Moderator
👤 A'zo
```

Discord'da bot faqat **o'zidan pastdagi** rollarga ta'sir qila oladi.

### Birinchi sozlamalar

```
/config view
/config logs kind:Moderatsiya channel:#loglar
/automod enable value:True
/config escalation count:3 action:timeout duration:1h
/config escalation count:5 action:ban
```

Yoki bularning hammasini [dashboard](#8-qadam--dashboard) orqali qiling.

---

## 8-qadam — Dashboard

Dashboard alohida ilova — batafsil qo'llanma: [`dashboard/README.md`](dashboard/README.md).

Qisqacha:

```bash
cd dashboard
npm install
cp .env.example .env.local     # qiymatlarni to'ldiring
npm run dev                     # http://localhost:3000
```

Vercel'ga deploy qilishda **Root Directory** ni `dashboard` deb belgilang.

---

## V1 dan V2 ga o'tish

Agar sizda V1 (SQLite) ishlagan bo'lsa va ma'lumotlarni saqlab qolmoqchi bo'lsangiz:

```bash
# 1) Eski bazani zaxiralang
cp data/uzcord.db data/uzcord-v1-backup.db

# 2) .env da SUPABASE_* qiymatlari to'ldirilganiga ishonch hosil qiling

# 3) Ko'chiring
npm run migrate:sqlite
```

Skript qayta-qayta ishlatilishi mumkin — yozuvlar takrorlanmaydi (upsert).
Ko'chiriladi: serverlar, moderatsiya tarixi, vaqtinchalik jazolar, eskalatsiya
qoidalari, AutoMod sozlamalari, taqiqlangan so'zlar, tugmali rollar.

Ko'chirish tugagandan keyin `data/uzcord.db` kerak emas — lekin zaxira sifatida
saqlab qo'ying.

---

## Komandalar ro'yxati

### 🛡️ Moderatsiya

| Komanda | Vazifasi |
|---|---|
| `/ban user reason duration delete_messages` | Ban (muddat berilsa — vaqtinchalik) |
| `/unban user_id reason` | Banni olib tashlash |
| `/kick user reason` | Serverdan chiqarish |
| `/timeout user duration reason` | Vaqtinchalik jimlik (max 28 kun) |
| `/untimeout user reason` | Timeoutni bekor qilish |
| `/warn user reason` | Ogohlantirish |
| `/unwarn case number` · `/unwarn all user` | Ogohlantirishni bekor qilish |
| `/warnings user` | Faol ogohlantirishlar |
| `/history user` | To'liq moderatsiya tarixi |
| `/case view number` · `/case reason number text` | Case ko'rish / sababni tahrirlash |
| `/purge amount user contains bots` | Xabarlarni ommaviy o'chirish |
| `/slowmode duration channel` | Sekin rejim |
| `/lock` · `/unlock` | Kanalni yopish / ochish |

### ⚙️ Sozlamalar

| Komanda | Vazifasi |
|---|---|
| `/config view` | Barcha sozlamalar |
| `/config locale` | Bot tili (uz / ru / en) |
| `/config logs kind channel` | Log kanallari |
| `/config welcome` · `/config goodbye` | Kutib olish / xayrlashuv |
| `/config autorole role` | Avtomatik rol |
| `/config module name enabled` | Modulni yoqish/o'chirish |
| `/config dm enabled` | Jazoda shaxsiy xabar |
| `/config escalation count action duration` | Avtomatik jazo qoidasi |
| `/automod ...` | AutoMod sozlamalari |
| `/buttonrole panel · add · remove` | Tugmali rollar |

### 🧰 Foydali

`/ping` · `/help` · `/serverinfo` · `/userinfo` · `/avatar`

---

## AutoMod qanday ishlaydi

Har bir yangi (va tahrirlangan) xabar 8 ta qoidadan o'tadi:

| Qoida | Nimani ushlaydi | Standart |
|---|---|---|
| `anti_spam` | 5 soniyada 5 tadan ko'p xabar | 🟢 yoqiq |
| `anti_duplicate` | bir xil xabarni 3 marta takrorlash | 🟢 yoqiq |
| `anti_invite` | `discord.gg/...` havolalari | 🟢 yoqiq |
| `anti_link` | ruxsat etilmagan domenlar | 🔴 o'chiq |
| `anti_mention` | 5 tadan ko'p mention | 🟢 yoqiq |
| `anti_caps` | 70% dan ko'p KATTA HARF | 🟢 yoqiq |
| `anti_emoji` | 10 tadan ko'p emoji | 🔴 o'chiq |
| `word_filter` | taqiqlangan so'zlar | 🟢 yoqiq |
| `anti_raid` | 15 soniyada 8 ta yangi a'zo | 🟢 yoqiq |

**Kim tekshirilmaydi:** `Manage Messages` yoki `Moderate Members` ruxsatiga ega a'zolar,
hamda `/automod ignore` orqali ozod qilingan kanallar va rollar.

**Jazolar:** `delete` · `warn` · `timeout` · `kick` · `ban`

**Taqiqlangan so'zlar ro'yxati bo'sh keladi** — har bir server o'z qoidalariga mos
so'zlarni o'zi qo'shadi. Filtr "aldash"ga qarshi himoyalangan: `s0z`, `s-o-z`, `sooooz`,
kirill yozuvi — hammasi bir xil deb topiladi.

---

## Botni doimiy ishlatish

### Variant A — PM2 (VPS uchun eng oddiy)

```bash
npm install -g pm2
npm run build

pm2 start dist/index.js --name uzcord
pm2 save
pm2 startup          # server qayta yuklansa ham avtomatik ishga tushadi

pm2 logs uzcord
pm2 restart uzcord
```

### Variant B — Docker

```bash
docker compose up -d --build
docker compose logs -f
```

> V2 da mahalliy baza fayli yo'q — Docker volume kerak emas.

### Variant C — Bepul hosting

Ma'lumotlar Supabase'da bo'lgani uchun endi **fayl tizimi saqlanishi shart emas**.
Bu bepul hostinglar bilan ishlashni ancha osonlashtiradi.

| Xizmat | Izoh |
|---|---|
| **Railway** | Eng oddiy. GitHub bilan bog'lanadi. |
| **Fly.io** | Bepul limit yaxshi. |
| **Oracle Cloud Free Tier** | Umrbod bepul VPS — eng yaxshi variant. |

> ⚠️ Hosting sozlamalarida `DISCORD_TOKEN` va `SUPABASE_SERVICE_ROLE_KEY` ni
> **Environment Variables** bo'limiga qo'ying, hech qachon kod ichiga yozmang.

---

## Tez-tez uchraydigan xatoliklar

| Xatolik | Sabab va yechim |
|---|---|
| `Used disallowed intents` | **SERVER MEMBERS** va **MESSAGE CONTENT** intentlari yoqilmagan (3.2-bosqich) |
| `An invalid token was provided` | `.env` dagi `DISCORD_TOKEN` noto'g'ri |
| `Supabase ga ulanib bo'lmadi` | `SUPABASE_URL` yoki `SUPABASE_SERVICE_ROLE_KEY` noto'g'ri. `anon` emas, **`service_role`** kaliti kerak |
| Komandalar ko'rinmayapti | `npm run deploy` bajarilmagan; yoki `DEV_GUILD_ID` bo'sh va global komandalar hali tarqalmagan (1 soatgacha); yoki taklif havolasida `applications.commands` scope belgilanmagan |
| `Missing Permissions` | Botning roli maqsadli a'zodan **pastda**. Settings → Roles dan yuqoriga suring |
| `Missing Access` | Bot o'sha kanalni ko'ra olmaydi. Kanal sozlamalaridan ruxsat bering |
| Dashboard'dagi o'zgarish botga yetmayapti | Kesh har daqiqada yangilanadi — 1 daqiqa kuting. Tezroq kerak bo'lsa `CACHE_REFRESH_MS=15000` |
| Dashboard'da server ko'rinmayapti | Sizda o'sha serverda **Manage Server** ruxsati bo'lishi kerak. Chiqib qaytadan kiring |
| Dashboard `redirect_uri` xatosi | Developer Portal → OAuth2 → Redirects ga aniq manzilni qo'shing (3.4-bosqich) |
| Bot xabarlarni o'chirmayapti | 14 kundan eski xabarlarni Discord ommaviy o'chirishga ruxsat bermaydi |

---

## Xavfsizlik qoidalari

1. **`.env` faylini hech qachon commit qilmang.** `.gitignore` buni bloklaydi.
2. **Token yoki `service_role` kaliti oshkor bo'lsa** — darhol yangilang
   (Developer Portal → Reset Token; Supabase → API Keys → Rotate).
3. **Administrator ruxsatini bermang.**
4. **Sinov uchun alohida server** ishlating.
5. **Zaxira nusxa**: Supabase → **Database → Backups**. Qo'lda olish uchun:
   `pg_dump` yoki Supabase CLI.
6. **`SESSION_SECRET`** ni tasodifiy va uzun qiling (kamida 32 belgi).

---

## Keyingi bosqichlar

**Bazada tayyor, botda hali yozilmagan** (keyingi bosqich):
ticket tizimi · leveling va XP · giveaway · eslatmalar · starboard · taglar · so'rovnomalar

Ularning barcha jadvallari va funksiyalari Supabase'da allaqachon mavjud —
dashboard'da sozlab qo'yishingiz mumkin, modul qo'shilishi bilan ishlay boshlaydi.

**Keyinroq:** musiqa (Lavalink) · o'yinlar · CBU valyuta kursi · namoz vaqtlari

---

## Litsenziya

[MIT](LICENSE) © 2026 [samirdev.uz](https://samirdev.uz)
