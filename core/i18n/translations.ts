export type Locale = "uz" | "ru";

export interface Translations {
  tabs: {
    home: string;
    cart: string;
    orders: string;
    courier: string;
    settings: string;
  };
  home: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categories: string;
    popular: string;
    delivery: string;
    express: string;
    food: string;
    packages: string;
  };
  cart: {
    title: string;
    empty: string;
    emptyHint: string;
  };
  orders: {
    title: string;
    empty: string;
    emptyHint: string;
  };
  courier: {
    title: string;
    subtitle: string;
    startWorking: string;
  };
  settings: {
    title: string;
    language: string;
    selectLanguage: string;
    uzbek: string;
    russian: string;
    appearance: string;
    notifications: string;
    about: string;
    version: string;
    darkMode: string;
    pushNotifications: string;
  };
}

export const translations: Record<Locale, Translations> = {
  uz: {
    tabs: {
      home: "Bosh sahifa",
      cart: "Savat",
      orders: "Buyurtmalar",
      courier: "Kuryer",
      settings: "Sozlamalar",
    },
    home: {
      title: "GoDelivery",
      subtitle: "Tez va qulay yetkazib berish",
      searchPlaceholder: "Manzilni qidiring...",
      categories: "Kategoriyalar",
      popular: "Mashhur",
      delivery: "Yetkazish",
      express: "Ekspress",
      food: "Ovqat",
      packages: "Posilkalar",
    },
    cart: {
      title: "Savat",
      empty: "Savatingiz bo'sh",
      emptyHint: "Buyurtma berish uchun mahsulot qo'shing",
    },
    orders: {
      title: "Buyurtmalar",
      empty: "Buyurtmalar yo'q",
      emptyHint: "Sizning buyurtmalaringiz shu yerda ko'rinadi",
    },
    courier: {
      title: "Kuryer paneli",
      subtitle: "Buyurtmalarni qabul qilish va yetkazish",
      startWorking: "Ishni boshlash",
    },
    settings: {
      title: "Sozlamalar",
      language: "Til",
      selectLanguage: "Tilni tanlang",
      uzbek: "O'zbek tili",
      russian: "Rus tili",
      appearance: "Ko'rinish",
      notifications: "Bildirishnomalar",
      about: "Ilova haqida",
      version: "Versiya",
      darkMode: "Tungi rejim",
      pushNotifications: "Push bildirishnomalar",
    },
  },
  ru: {
    tabs: {
      home: "Главная",
      cart: "Корзина",
      orders: "Заказы",
      courier: "Курьер",
      settings: "Настройки",
    },
    home: {
      title: "GoDelivery",
      subtitle: "Быстрая и удобная доставка",
      searchPlaceholder: "Найти адрес...",
      categories: "Категории",
      popular: "Популярное",
      delivery: "Доставка",
      express: "Экспресс",
      food: "Еда",
      packages: "Посылки",
    },
    cart: {
      title: "Корзина",
      empty: "Корзина пуста",
      emptyHint: "Добавьте товары для оформления заказа",
    },
    orders: {
      title: "Заказы",
      empty: "Заказов пока нет",
      emptyHint: "Ваши заказы появятся здесь",
    },
    courier: {
      title: "Панель курьера",
      subtitle: "Принимайте и доставляйте заказы",
      startWorking: "Начать работу",
    },
    settings: {
      title: "Настройки",
      language: "Язык",
      selectLanguage: "Выберите язык",
      uzbek: "Узбекский",
      russian: "Русский",
      appearance: "Оформление",
      notifications: "Уведомления",
      about: "О приложении",
      version: "Версия",
      darkMode: "Тёмная тема",
      pushNotifications: "Push-уведомления",
    },
  },
};
