# 🎮 Memory Game (monorepo)

Klassik xotira o‘yini: bir xil rangli juft kartalarni toping. Veb (React + Vite + TypeScript) va Android (React Native CLI) ilovalari bitta umumiy o‘yin mantig‘idan foydalanadi.

## Tuzilma

```
packages/core   # umumiy mantiq (TypeScript): reducer, deck, i18n (uz/ru/en), mavzular, saqlash, testlar
apps/web        # Vite + React 19 + TypeScript (mobil / planshet / desktop uchun moslashgan)
apps/api        # Fastify + Postgres: hisoblar, reyting (Railway'da ishlaydi)
apps/mobile     # React Native CLI (Android)
```

## Imkoniyatlar

- 3 qiyinlik darajasi (har birining vaqt va yurish limiti bor), daraja almashganda o‘yin darhol yangilanadi
- 3 til: O‘zbekcha, Русский, English (qurilma tiliga qarab avtomatik tanlanadi)
- Qorong‘i / yorug‘ / tizim mavzusi
- Ranglarni ajratishga yordam beradigan karta belgilari (yoqish/o‘chirish mumkin)
- Pauza, ball tizimi (juftlik + vaqt + yurish bonuslari), har bir daraja uchun alohida rekord
- Ovoz (veb) va tebranish (Android), `prefers-reduced-motion` hurmat qilinadi, klaviatura va ekran o‘qish dasturi qo‘llab-quvvatlanadi

## Ishga tushirish

```bash
npm install            # ildizda, hamma workspace uchun

npm run web            # veb: http://localhost:5173
npm run web:build      # veb build -> apps/web/dist

npm run mobile:start   # Metro
npm run android        # Android emulyator/qurilma (Android SDK + JDK 17 kerak)

npm test               # core testlari
npm run typecheck      # barcha paketlar
npm run lint
```

## Android APK

**Doim oxirgi versiya:** https://github.com/Abdullohkhan/memory-game/releases/latest/download/memory-game.apk

`master`ga har merge'dan keyin GitHub Actions APK yig‘ib yangi Release chiqaradi (`v1.0.<run>`), `versionCode` har safar oshadi, shuning uchun eski ilova ustidan yangilanadi.
Mahalliy: `cd apps/mobile/android && ./gradlew assembleRelease`. Release APK shaxsiy keystore bilan imzolanadi (GitHub secrets, pastga qarang). Secrets yo‘q bo‘lsa debug kalit ishlatiladi.

## Hisoblar va reyting

- **Nickname bilan kirish** (parolsiz) va ixtiyoriy **Google bilan kirish/ulash**. Rekordlar va sozlamalar hisobga bog‘lanadi, har bir daraja uchun umumiy reyting bor.
- Ball serverda `moves` va `timeLeft` dan qayta hisoblanadi, mijoz ball yubormaydi; mumkin bo‘lmagan natijalar rad etiladi.
- Token qurilmada saqlanadi, bazada faqat uning SHA-256 xeshi turadi.
- `VITE_API_URL` / `apiUrl` bo‘sh bo‘lsa hisob funksiyalari yashirinadi va o‘yin oldingidek oflayn ishlaydi.

## Railway

Bitta Railway loyihasida 3 ta servis:

1. **Postgres** — "New → Database → PostgreSQL".
2. **api** — "New → GitHub Repo" → shu repo. Settings → *Config-as-code file path*: `/apps/api/railway.json`. Variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = veb manzilingiz (masalan `https://memory-web.up.railway.app`), vergul bilan bir nechta
   - `GOOGLE_CLIENT_IDS` = Google *Web* client ID (ixtiyoriy, Google kirish uchun)
   - Settings → Networking → *Generate domain*
3. **web** — yana shu repo, config fayl yo‘li `/railway.json` (standart). Variables (build vaqtida o‘qiladi):
   - `VITE_API_URL` = api servisining domeni (`https://...up.railway.app`)
   - `VITE_GOOGLE_CLIENT_ID` = Google *Web* client ID (ixtiyoriy)

Health-check: `GET /health`.

## Google bilan kirish (ixtiyoriy)

Google Cloud Console → APIs & Services → Credentials:
1. **OAuth client (Web application)** — "Authorized JavaScript origins" ga veb manzilingizni qo‘shing. Uning *Client ID* si `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_IDS` va GitHub variable `GOOGLE_WEB_CLIENT_ID` ga yoziladi.
2. **OAuth client (Android)** — package `com.memorygame`, SHA-1 = release keystore'ning SHA-1 i (`github-secrets.txt` ichida).

## GitHub sozlamalari (Actions)

Settings → Secrets and variables → Actions:
- **Secrets:** `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (release imzosi; yo‘q bo‘lsa debug kalit ishlatiladi va ogohlantirish chiqadi)
- **Variables:** `API_URL` (api domeni), `GOOGLE_WEB_CLIENT_ID` — APK ichiga kiritiladi (ochiq qiymatlar, maxfiy emas)

Keystore faylini hech qachon repoga qo‘shmang (`*.jks` ignore qilingan) va zaxira nusxasini saqlang.

## Eslatma

`react` versiyasi ildiz `package.json` dagi `overrides` orqali bitta (19.2.3) qilib qotirilgan: React Native renderer React'ning aynan shu versiyasini talab qiladi.
