# Multi-Store Backend & Database

## What & Why
Har bir kichik do'kon o'z kabinetini ochib, mahsulotlarini va narxlarini qo'sha olishi uchun backend infratuzilmasini qurish. Buyurtma berilganda do'kon egasiga xabarnoma yuborish tizimi.

## Done looks like
- `store` roli mavjud — foydalanuvchi register bo'lganda yoki admin tomonidan tayinlanganda
- `stores` jadvali bor: nomi, manzili, telefoni, logotipi, isActive, ownerId
- Har bir mahsulotda `storeId` maydoni mavjud — qaysi do'konga tegishli ekanligini ko'rsatadi
- Do'kon egasi faqat o'z mahsulotlarini ko'ra/qo'sha/tahrirlaya/o'chira oladi
- Buyurtma berilganda, shu buyurtmadagi mahsulotlar qaysi do'konlarga tegishli ekani aniqlanadi va har bir do'kon egasiga alohida xabarnoma yuboriladi (qaysi mahsulot, qancha miqdorda)
- `GET /api/store/orders` — do'kon egasi o'ziga tegishli buyurtmalarni ko'radi
- `GET /api/store/products` — do'kon egasi o'z mahsulotlarini boshqaradi
- `POST/PUT/DELETE /api/store/products/:id` — do'kon mahsulot boshqaruvi
- Admin barcha do'konlarni ko'ra va boshqara oladi
- WebSocket orqali real-vaqtli xabarnomalar do'kon egasiga yetadi

## Out of scope
- To'lov va komissiya tizimi (keyingi bosqich)
- Do'kon reytingi va sharhlar
- Ko'p do'kon bir buyurtmada alohida to'lov (hozircha umumiy to'lov)

## Steps
1. **Schema o'zgartirishlari** — `stores` jadvalini qo'shish, `users` jadvaliga `storeId` nullable FK, `products` jadvaliga `storeId` nullable FK, userRole enum ga `store` qo'shish
2. **Migration** — Mavjud ma'lumotlar bazasiga yangi ustunlar va jadval qo'shish
3. **Store auth** — `/api/auth/register` da `store` rolini qo'llab-quvvatlash; do'kon yaratish mantiqi (register paytida avtomatik `stores` yozuvi)
4. **Store API routes** — `/api/store/*` routerini yaratish: profil, mahsulot CRUD, buyurtmalar ro'yxati
5. **Buyurtma xabarnoma mantiqi** — Buyurtma yaratilganda `items` ni do'konlarga ajratib, har do'kon egasiga `notifications` jadvaliga yozuv qo'shish va WebSocket orqali yuborish
6. **Admin do'kon boshqaruvi** — `/api/admin/stores` — barcha do'konlarni ko'rish, aktivlashtirish/o'chirish

## Relevant files
- `shared/schema.ts`
- `server/routes.ts`
- `server/db-storage.ts`
- `server/auth-routes.ts`
- `server/admin-routes.ts`
- `server/websocket.ts`
- `server/index.ts`
