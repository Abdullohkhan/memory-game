# 🎮 Memory Game (monorepo)

Klassik xotira o‘yini: bir xil rangli juft kartalarni toping. Veb (React + Vite + TypeScript) va Android (React Native CLI) ilovalari bitta umumiy o‘yin mantig‘idan foydalanadi.

## Tuzilma

```
packages/core   # umumiy mantiq (TypeScript): reducer, deck, i18n (uz/ru/en), mavzular, saqlash, testlar
apps/web        # Vite + React 19 + TypeScript (mobil / planshet / desktop uchun moslashgan)
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

Mahalliy: `cd apps/mobile/android && ./gradlew assembleRelease` →
`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`.

GitHub Actions (`.github/workflows/ci.yml`) har push'da APK yig‘adi: **Actions → run → Artifacts → memory-game-android-apk**.
APK hozircha debug kalit bilan imzolanadi; Play Store uchun o‘z keystore'ingizni ulang.

## Eslatma

`react` versiyasi ildiz `package.json` dagi `overrides` orqali bitta (19.2.3) qilib qotirilgan: React Native renderer React'ning aynan shu versiyasini talab qiladi.
