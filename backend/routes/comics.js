const router = require('express').Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Comic = require('../models/Comic');
const { auth, adminOnly } = require('../middleware/auth');

// Налаштування доступу до твоєї хмари
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Вказуємо multer зберігати файли прямо в Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'angusreader_covers', // Так буде називатися папка в хмарі
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});
const upload = multer({ storage: storage });

// Функція для витягування Public ID з повної адреси Cloudinary
const getPublicIdFromUrl = (url) => {
  try {
    // Посилання виглядає так: .../upload/v123456/angusreader_covers/filename.jpg
    const splits = url.split('/upload/');
    if (splits.length < 2) return null;
    
    // Прибираємо префікс версії (v123456/) якщо він є, і розширення файлу (.jpg)
    const pathAfterUpload = splits[1].replace(/^v\d+\//, ''); 
    const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
    
    return publicId; // Поверне: angusreader_covers/filename
  } catch (err) {
    return null;
  }
};

// GET all comics with search/filter/sort/paginate
router.get('/', async (req, res) => {
  try {
    const { search, genre, status, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { genres: { $regex: search, $options: 'i' } }
    ];
    if (genre) query.genres = genre;
    if (status) query.status = status;
    const total = await Comic.countDocuments(query);
    const comics = await Comic.find(query)
      .select('-chapters.pages')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ comics, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET popular (top by views)
router.get('/popular', async (req, res) => {
  try {
    const comics = await Comic.find().select('-chapters.pages').sort('-views').limit(10);
    res.json(comics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET latest updated
router.get('/latest', async (req, res) => {
  try {
    const comics = await Comic.find().select('-chapters.pages').sort('-updatedAt').limit(20);
    res.json(comics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all genres
router.get('/genres', async (req, res) => {
  try {
    const genres = await Comic.distinct('genres');
    res.json(genres.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single comic by id or slug
router.get('/:id', async (req, res) => {
  try {
    const comic = await Comic.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { titleSlug: req.params.id }]
    }).select('-chapters.pages');
    if (!comic) return res.status(404).json({ message: 'Comic not found' });
    comic.views += 1;
    await comic.save();
    res.json(comic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET chapter pages
router.get('/:id/chapter/:chapterNum', async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Comic not found' });
    const chapter = comic.chapters.find(c => c.number === Number(req.params.chapterNum));
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    chapter.views += 1;
    await comic.save();
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create comic (admin)
router.post('/', auth, adminOnly, upload.single('cover'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.cover = req.file.path; // Отримуємо готове посилання від Cloudinary
    if (data.genres && typeof data.genres === 'string') data.genres = JSON.parse(data.genres);
    data.createdBy = req.user._id;
    const comic = await Comic.create(data);
    res.status(201).json(comic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update comic (admin)
router.put('/:id', auth, adminOnly, (req, res, next) => {
  // Запускаємо завантаження файлу і ловимо помилку на місці
  upload.single('cover')(req, res, (err) => {
    if (err) {
      // Перетворюємо об'єкт помилки на читабельний текст
      console.error("ДЕТАЛІ ПОМИЛКИ CLOUDINARY:", JSON.stringify(err, null, 2));
      return res.status(500).json({ message: "Помилка Cloudinary: " + (err.message || 'Невідома помилка') });
    }
    next(); // Якщо все ок, йдемо далі
  });
}, async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.cover = req.file.path; 
    
    if (data.genres && typeof data.genres === 'string') {
      data.genres = JSON.parse(data.genres);
    }
    
    const comic = await Comic.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });
    
    res.json(comic);
  } catch (err) {
    console.error("ПОМИЛКА БАЗИ ДАНИХ:", err);
    res.status(500).json({ message: err.message });
  }
});
// POST add chapter (admin)
router.post('/:id/chapters', auth, adminOnly, (req, res, next) => {
  upload.array('pages', 200)(req, res, (err) => {
    if (err) {
      console.log("=== СУПЕР-ДЕТАЛЬНА ПОМИЛКА CLOUDINARY ===");
      console.dir(err, { depth: null }); // Секретна зброя Node.js
      console.log("=========================================");
      return res.status(500).json({ message: "Помилка завантаження сторінок" });
    }
    next();
  });
}, async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    // Якщо файли є, дістаємо їхні шляхи з хмари
    const pages = req.files ? req.files.map(f => f.path) : [];

    const chapter = {
      number: Number(req.body.number),
      title: req.body.title || '',
      pages
    };

    comic.chapters.push(chapter);
    comic.chapters.sort((a, b) => a.number - b.number);
    await comic.save();
    
    res.status(201).json(comic);
  } catch (err) {
    console.log("=== СУПЕР-ДЕТАЛЬНА ПОМИЛКА БАЗИ ДАНИХ ===");
    console.dir(err, { depth: null }); // Секретна зброя Node.js
    res.status(500).json({ message: "Помилка бази даних або збереження" });
  }
});

// DELETE chapter (admin) - з очищенням хмари
router.delete('/:id/chapters/:chapterId', auth, adminOnly, async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    const chapter = comic.chapters.id(req.params.chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

    // 1. ЗБИРАЄМО PUBLIC ID ВСІХ СТОРІНОК ЦЬОГО РОЗДІЛУ
    if (chapter.pages && chapter.pages.length > 0) {
      const publicIds = chapter.pages.map(url => getPublicIdFromUrl(url)).filter(Boolean);

      // 2. ВИДАЛЯЄМО З CLOUDINARY ЗА ОДИН ЗАПИТ
      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
        console.log("Очищено сторінки з Cloudinary:", publicIds);
      }
    }

    // 3. Видаляємо розділ з MongoDB
    comic.chapters.pull(req.params.chapterId);
    await comic.save();

    res.json(comic);
  } catch (err) {
    console.error("Помилка видалення розділу:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST rate comic
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating } = req.body;
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Not found' });
    comic.rating = ((comic.rating * comic.ratingCount) + Number(rating)) / (comic.ratingCount + 1);
    comic.ratingCount += 1;
    await comic.save();
    res.json({ rating: comic.rating, ratingCount: comic.ratingCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add a comment to a comic
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text, username } = req.body;
    
    // Знаходимо комікс за ID
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    // Створюємо новий об'єкт коментаря
    const newComment = {
      user: req.user._id, // Беремо ID з токена авторизації
      username: username, // Ім'я передамо з фронтенду
      text: text
    };

    // Додаємо коментар у масив та зберігаємо
    comic.comments.push(newComment);
    await comic.save();

    // Повертаємо оновлений масив коментарів
    res.status(201).json(comic.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// DELETE видалення коментаря
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    // 1. Знаходимо комікс
    const comic = await Comic.findById(req.params.id);
    if (!comic) {
      return res.status(404).json({ message: 'Комікс не знайдено' });
    }

    // 2. Шукаємо індекс коментаря в масиві
    const commentIndex = comic.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Коментар не знайдено' });
    }

    const comment = comic.comments[commentIndex];

    // 3. ПЕРЕВІРКА БЕЗПЕКИ: чи це автор коментаря АБО адмін?
    // Захист від того, щоб хтось не видалив чуже через код
    if (comment.user && comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Ви не можете видалити чужий коментар' });
    }

    // 4. Видаляємо коментар з масиву
    comic.comments.splice(commentIndex, 1);
    await comic.save();

    res.json({ message: 'Коментар успішно видалено' });
  } catch (err) {
    // Якщо щось піде не так, тепер ми ТОЧНО побачимо це в логах
    console.error("ПОМИЛКА ВИДАЛЕННЯ КОМЕНТАРЯ:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT edit chapter (admin)
router.put('/:id/chapters/:chapterId', auth, adminOnly, upload.array('pages', 200), async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    const chapter = comic.chapters.id(req.params.chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

    // Оновлюємо базові текстові дані
    if (req.body.number) chapter.number = Number(req.body.number);
    if (req.body.title !== undefined) chapter.title = req.body.title;

    // ЯКЩО АДМІН ЗАВАНТАЖИВ НОВІ ФАЙЛИ ДЛЯ СТОРІНОК:
    if (req.files && req.files.length > 0) {
      
      // 1. Спочатку видаляємо старі картинки цього розділу з хмари
      if (chapter.pages && chapter.pages.length > 0) {
        const oldPublicIds = chapter.pages.map(url => getPublicIdFromUrl(url)).filter(Boolean);
        if (oldPublicIds.length > 0) {
          await cloudinary.api.delete_resources(oldPublicIds);
          console.log("Очищено старі сторінки при редагуванні:", oldPublicIds);
        }
      }

      // 2. Записуємо нові посилання від Cloudinary
      chapter.pages = req.files.map(f => f.path);
    }

    // Сортуємо розділи за номером на випадок, якщо номер змінився
    comic.chapters.sort((a, b) => a.number - b.number);
    await comic.save();

    res.json(comic);
  } catch (err) {
    console.error("Помилка редагування розділу:", err);
    res.status(500).json({ message: err.message });
  }
});
