import { db } from "./index";
import { categories, products } from "./schema";

async function seed() {
  console.log("Seeding database...");

  const categoryData = [
    { name: "Burgers", icon: "🍔" },
    { name: "Pizza", icon: "🍕" },
    { name: "Sushi", icon: "🍣" },
    { name: "Drinks", icon: "🥤" },
    { name: "Desserts", icon: "🍰" },
    { name: "Salads", icon: "🥗" },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning();

  const productData = [];
  for (let i = 1; i <= 20; i++) {
    const cat = insertedCategories[Math.floor(Math.random() * insertedCategories.length)];
    productData.push({
      categoryId: cat.id,
      name: `${cat.name} Special ${i}`,
      priceInt: Math.floor(Math.random() * 50000) + 15000,
      imageUrl: `https://picsum.photos/seed/${cat.name}${i}/400/300`,
      isPopular: Math.random() > 0.7,
    });
  }

  await db.insert(products).values(productData);
  console.log("Seeding completed!");
}

seed().catch(console.error);
