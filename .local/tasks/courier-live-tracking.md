# Kuryer Real-Vaqtli Kuzatuv (Korzinka Go uslubi)

## What & Why
Mijoz buyurtma bergandan so'ng kurer qayerda ekanini xaritada jonli ko'ra olishi kerak — xuddi Korzinka Go yoki Yandex Go kabi. Kuryer ilovada lokatsiyasini yuboradi, mijoz ekranida xaritada harakat qilayotgani ko'rinadi.

## Done looks like
- Mijoz "Buyurtma holati" ekranida jonli xarita ko'radi: kurer ikonkasi harakatlanib turadi
- Buyurtma holatlari ko'rsatiladi: "Buyurtma qabul qilindi" → "Do'konga ketmoqda" → "Mahsulot olinmoqda" → "Sizga kelmoqda" → "Yetkazildi"
- Progress bar yoki stepper orqali holat vizual ko'rinadi
- Kuryer ilovasi: har 5 soniyada GPS lokatsiyasini WebSocket orqali serverga yuboradi
- Mijoz ekrani: WebSocket orqali kuryer lokatsiyasini oladi va xaritada marker yangilanadi
- Taxminiy yetkazish vaqti ko'rsatiladi (masofaga qarab hisoblangan)
- Kuryer "Olib ketdim" va "Yetkazdim" tugmalarini bosib holatni yangilaydi
- Buyurtma yetkazilganda mijozga xabarnoma keladi

## Out of scope
- Marshrutni ko'rsatish (turn-by-turn navigation)
- Kuryer reyting tizimi
- Ko'p to'xtalishli marshrutlar

## Steps
1. **WebSocket lokatsiya kanali** — Serverda kuryer uchun lokatsiya yuborish va mijoz uchun tinglash kanallarini qo'shish; kuryer tokeni bilan autentifikatsiya
2. **Kuryer lokatsiya yuborish** — Kuryer ekranida `expo-location` orqali GPS olish, har 5 soniyada WebSocket ga yuborish (faqat faol buyurtma bo'lganda)
3. **Mijoz kuzatuv ekrani** — `react-native-maps` bilan xarita, kuryer markeri, buyurtma holati stepper, taxminiy vaqt
4. **Buyurtma holatlari** — Kuryer "Do'konga ketdim", "Olib ketdim", "Yetkazdim" tugmalarini bosib holatni yangilaydi; WebSocket orqali mijozga real-vaqtli xabar
5. **Kuryer buyurtmalar UI yangilash** — Mavjud kuryer ekranlarini yangi holat oqimi bilan moslashtirish, jonli lokatsiya yuborish integratsiyasi

## Relevant files
- `server/websocket.ts`
- `app/courier/`
- `app/order/`
- `app/(tabs)/`
- `server/routes.ts`
