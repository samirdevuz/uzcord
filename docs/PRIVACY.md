# Maxfiylik siyosati — UzCord

**Oxirgi yangilanish:** 2026-yil 20-sentabr

UzCord ("bot") — samirdev.uz tomonidan yuritiladigan ochiq kodli Discord boti.
Bu hujjat bot qanday ma'lumot to'plashi va undan qanday foydalanishini tushuntiradi.

## 1. Qanday ma'lumotlar saqlanadi

Bot faqat o'z vazifasini bajarish uchun zarur bo'lgan ma'lumotlarni saqlaydi:

| Ma'lumot | Nima uchun |
|---|---|
| Server (guild) IDsi | Sozlamalarni serverga bog'lash |
| Kanal va rol IDlari | Log kanallari, avtomatik rol, tugmali rollar |
| Foydalanuvchi IDsi va tegi | Moderatsiya tarixi (case tizimi) |
| Moderator IDsi va tegi | Kim jazo berganini qayd etish |
| Jazo sababi va muddati | Moderatsiya tarixi |
| Taqiqlangan so'zlar ro'yxati | AutoMod filtri (server admini kiritadi) |

## 2. Qanday ma'lumotlar SAQLANMAYDI

- Xabarlar matni bazaga **yozilmaydi**. AutoMod xabarni faqat xotirada, bir lahzada tekshiradi.
- Shaxsiy xabarlar (DM) o'qilmaydi va saqlanmaydi.
- Ovozli suhbatlar yozib olinmaydi.
- To'lov ma'lumotlari, elektron pochta, parollar yoki boshqa shaxsiy ma'lumotlar to'planmaydi.

## 3. Ma'lumotlar qayerda saqlanadi

Ma'lumotlar Supabase (PostgreSQL) bazasida, Frankfurt (Yevropa Ittifoqi)
serverlarida saqlanadi. Ular uchinchi shaxslarga sotilmaydi, ijaraga berilmaydi
va uzatilmaydi.

## 3a. Boshqaruv paneli (uzcord.samirdev.uz)

Panelga Discord OAuth orqali kiriladi. Biz Discord'dan faqat ikkita ruxsat
so'raymiz:

- `identify` — foydalanuvchi IDsi, nomi va avatari
- `guilds` — siz a'zo bo'lgan serverlar ro'yxati

Bu ma'lumotlardan faqat siz **Manage Server** ruxsatiga ega bo'lgan serverlarni
aniqlash uchun foydalanamiz. Ular imzolangan cookie ichida 7 kun saqlanadi va
bazaga yozilmaydi. Panel orqali kiritilgan sozlama o'zgarishlari kim va qachon
qilgani bilan birga `dashboard_audit` jadvalida qayd etiladi.

## 4. Saqlash muddati

Ma'lumotlar server aktiv bo'lgan davrda saqlanadi.
Bot serverdan chiqarilganda ma'lumotlar darhol o'chirilmaydi (bot qayta qo'shilsa
sozlamalar joyida bo'lishi uchun), lekin so'rov bo'yicha o'chiriladi.

## 5. Ma'lumotlarni o'chirish

Server egasi yoki foydalanuvchi o'z ma'lumotlarini o'chirishni so'rashi mumkin:

- Discord orqali: [discord.gg/JGfWtj3ydt](https://discord.gg/JGfWtj3ydt)
- Sayt orqali: [uzcord.samirdev.uz](https://uzcord.samirdev.uz)

So'rov 30 kun ichida bajariladi.

## 6. Bolalar xavfsizligi

Discord shartlariga muvofiq, bot 13 yoshdan kichik foydalanuvchilar uchun mo'ljallanmagan.

## 7. O'zgarishlar

Ushbu siyosat o'zgarishi mumkin. Muhim o'zgarishlar bot serverida e'lon qilinadi.

## 8. Aloqa

Savollar bo'yicha: [uzcord.samirdev.uz](https://uzcord.samirdev.uz)
