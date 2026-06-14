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
router.put('/:id', auth, adminOnly, upload.single('cover'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.cover = req.file.path; // Отримуємо готове посилання від Cloudinary
    if (data.genres && typeof data.genres === 'string') data.genres = JSON.parse(data.genres);
    const comic = await Comic.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });
    res.json(comic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// DELETE comic (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Comic.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add chapter (admin)
router.post('/:id/chapters', auth, adminOnly, upload.array('pages', 200), async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Comic not found' });
    const pages = req.files.map(f => `/uploads/${f.filename}`);
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
    res.status(500).json({ message: err.message });
  }
});

// DELETE chapter (admin)
router.delete('/:id/chapters/:chapterNum', auth, adminOnly, async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Comic not found' });
    comic.chapters = comic.chapters.filter(c => c.number !== Number(req.params.chapterNum));
    await comic.save();
    res.json({ message: 'Chapter deleted' });
  } catch (err) {
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
