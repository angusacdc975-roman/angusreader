const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ username, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, username, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get me
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// Bookmark toggle
router.post('/bookmark/:comicId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.bookmarks.indexOf(req.params.comicId);
    if (idx === -1) user.bookmarks.push(req.params.comicId);
    else user.bookmarks.splice(idx, 1);
    await user.save();
    res.json({ bookmarks: user.bookmarks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;
