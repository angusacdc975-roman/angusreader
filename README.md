# 📚 AngusReader — Comic Reader Website

Повнофункціональний сайт для читання коміксів з фронтендом на React і бекендом на Node.js + MongoDB.

---

## 🗂 Структура проекту

```
angusreader/
├── backend/          # Node.js + Express + MongoDB
│   ├── models/       # User, Comic (Mongoose схеми)
│   ├── routes/       # auth.js, comics.js
│   ├── middleware/   # auth.js (JWT)
│   ├── uploads/      # Завантажені зображення (auto-created)
│   ├── server.js
│   ├── .env
│   └── package.json
└── frontend/         # React SPA
    ├── public/
    └── src/
        ├── components/  # Navbar, ComicCard, Modals
        ├── pages/       # Home, Catalog, ComicDetail, Reader, Login...
        ├── context/     # AuthContext, ToastContext
        └── utils/       # api.js (axios)
```

---

## 🚀 Запуск проекту

### 1. Бекенд

```bash
cd backend
npm install
# .env вже налаштований з вашим MongoDB URI
npm start
# або для розробки:
npm run dev
```

Сервер запуститься на `http://localhost:5000`

### 2. Фронтенд

```bash
cd frontend
npm install
npm start
```

Відкриється на `http://localhost:3000`

---

## ⚙️ Функціонал (Advanced рівень)

### Публічна частина
- 🏠 **Головна** — героя-банер з популярними, свіжі оновлення
- 📖 **Каталог** — пошук, фільтр за жанром/статусом, сортування, пагінація
- 📄 **Сторінка коміксу** — інфо, список розділів, рейтинг, закладки
- 📱 **Рідер** — читання посторінково, навігація між розділами

### Авторизація (2 ролі)
- 👤 **Рядовий користувач** — закладки, перегляд статусів
- ⚙️ **Адміністратор** — повний CRUD коміксів та розділів

### Адмін-панель (`/admin`)
- Таблиця всіх коміксів з пошуком/фільтром
- Кнопки редагування та видалення (з підтвердженням)
- Додавання нового коміксу через модальне вікно
- Завантаження розділів із зображеннями

### Валідація форм
- Всі форми мають клієнтську валідацію з помилками

---

## 🔑 Перший адміністратор

Зареєструйтесь через `/register`, потім змініть роль у MongoDB:

```javascript
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 🛠 Технології

| Частина | Технологія |
|---------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcrypt |
| File Upload | Multer |
| Styling | Custom CSS (темна тема) |
