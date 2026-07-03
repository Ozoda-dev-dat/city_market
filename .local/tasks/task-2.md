---
title: Do'kon egasi mobil kabineti
---
# Do'kon Egasi Mobil Kabineti

## What & Why
Do'kon egalari (store role) uchun maxsus mobil ekranlar: mahsulot qo'shish/tahrirlash, kelayotgan buyurtmalarni ko'rish, xabarnomalar. Asosiy customer interfeysi bilan alohida, lekin bitta ilovada.

## Done looks like
- Do'kon egasi login qilganda customer tab bar o'rniga do'kon kabineti ko'rinadi
- **Dashboard ekrani**: Bugungi buyurtmalar soni, umumiy tushum, eng ko'p sotilgan mahsulotlar
- **Mahsulotlar ekrani**: Do'kon mahsulotlari ro'yxati, qo'shish/tahrirlash/o'chirish tugmalari, stok miqdori boshqaruvi
- **Buyurtmalar ekrani**: Faqat o'z do'koniga tegishli buyurtmalar, holati (yangi/tayyorlanmoqda/tayyor)
- **Xabarnomalar**: Yangi buyurtma kelganda push xabarnoma + in-app bildirish, qaysi mahsulotdan nechta kerakligi ko'rinadi
- **Do'kon profili**: Nomi, manzili, telefon, logotip tahrirlash
- Do'kon egasi mahsulot qo'shganda kamera orqali rasm olish yoki galereyadan tanlash imkoniyati

## Out of scope
- Do'kon reytingi va mijoz sharhlari
- Statistika grafiklar (keyingi bosqich)
- Bir nechta do'kon boshqarish (bitta foydalanuvchi = bitta do'kon)

## Steps
1. **Router sozlash** — `app/(store)/` papkasi va `_layout.tsx` — faqat `store` rolida ko'rinadi; login paytida rolga qarab redirect
2. **Do'kon mahsulotlar ekrani** — Mahsulot qo'shish formi (nomi, narxi, rasmini tanlash, stok, kategoriya), tahrirlash, o'chirish
3. **Buyurtmalar ekrani** — Do'konga tegishli buyurtmalar ro'yxati, har bir buyurtmada qaysi mahsulotdan nechta kerakligi ko'rsatiladi, holat tugmalari (Tayyorlanmoqda / Tayyor)
4. **Dashboard ekrani** — Bugungi statistika kartalar: buyurtmalar, tushum, mahsulotlar soni
5. **Xabarnomalar** — Yangi buyurtma kelganda WebSocket orqali real-vaqtli xabarnoma, in-app notification badge
6. **Do'kon profili ekrani** — Do'kon ma'lumotlarini tahrirlash, expo-image-picker bilan logotip yuklash

## Relevant files
- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/auth.tsx`
- `context/`
- `server/routes.ts`
- `shared/schema.ts`