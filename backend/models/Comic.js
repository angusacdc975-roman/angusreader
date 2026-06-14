const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  title: { type: String, default: '' },
  pages: [{ type: String }], // array of image URLs/paths
  publishedAt: { type: Date, default: Date.now },
  views: { type: Number, default: 0 }
});



const comicSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  titleSlug: { type: String, unique: true },
  description: { type: String, default: '' },
  cover: { type: String, default: '' },
  author: { type: String, default: '' },
  artist: { type: String, default: '' },
  genres: [{ type: String }],
  status: { type: String, enum: ['ongoing', 'completed', 'hiatus'], default: 'ongoing' },
  year: { type: Number },
  language: { type: String, default: 'uk' },
  chapters: [chapterSchema],
  comments: [
    {
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
      },
      username: { 
        type: String, 
        required: true 
      },
      text: { 
        type: String, 
        required: true 
      },
      createdAt: { 
        type: Date, 
        default: Date.now 
      }
    }
  ],
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

comicSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.titleSlug) {
    this.titleSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9а-яіїєё]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Comic', comicSchema);
