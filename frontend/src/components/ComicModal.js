import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const GENRES = ['Бойовик','Комедія','Детектив','Драма','Фентезі','Фантастика','Жахи','Романтика','Cупергероїка','Пригоди','Альтернатива','Підліткова драма'];

export default function ComicModal({ comic, onClose, onSaved }) {
  const { addToast } = useToast();
  
  // Додали cover в початковий стан форми
  const [form, setForm] = useState({
    title: '', description: '', author: '', artist: '', cover: '', genres: [], status: 'ongoing', year: new Date().getFullYear()
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Підтягуємо існуючу обкладинку при редагуванні
  useEffect(() => {
    if (comic) {
      setForm({ 
        title: comic.title || '', 
        description: comic.description || '', 
        author: comic.author || '', 
        artist: comic.artist || '', 
        cover: comic.cover || '', 
        genres: comic.genres || [], 
        status: comic.status || 'ongoing', 
        year: comic.year || new Date().getFullYear() 
      });
    }
  }, [comic]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Назва обов'язкова";
    if (form.title.trim().length < 2) e.title = 'Мінімум 2 символи';
    if (form.year && (form.year < 1900 || form.year > 2030)) e.year = 'Некоректний рік';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Відправляємо звичайний об'єкт, без FormData
      const data = { ...form };
      
      if (comic) {
        await api.put(`/comics/${comic._id}`, data);
      } else {
        await api.post('/comics', data);
      }
      
      addToast(comic ? 'Комікс оновлено!' : 'Комікс створено!');
      onSaved();
    } catch (err) {
      addToast(err.response?.data?.message || 'Помилка', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const toggleGenre = (g) => setForm(f => ({
    ...f, genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g]
  }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{comic ? '✏️ Редагувати комікс' : '➕ Новий комікс'}</div>

        <div className="form-group">
          <label className="form-label">Назва *</label>
          <input className={`form-input ${errors.title ? 'border-red' : ''}`} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Назва коміксу" />
          {errors.title && <div className="form-error">{errors.title}</div>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Опис</label>
          <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Короткий опис..." />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Автор</label>
            <input className="form-input" value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Художник</label>
            <input className="form-input" value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Рік</label>
            <input className="form-input" type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
            {errors.year && <div className="form-error">{errors.year}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="ongoing">Виходить</option>
              <option value="completed">Завершено</option>
              <option value="hiatus">Пауза</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Жанри</label>
          <div className="filter-genres">
            {GENRES.map(g => (
              <span key={g} className={`genre-tag ${form.genres.includes(g) ? 'active' : ''}`} onClick={() => toggleGenre(g)}>{g}</span>
            ))}
          </div>
        </div>

        {/* Виправлене поле обкладинки: тепер воно коректно працює зі станом form */}
        <div className="form-group">
          <label className="form-label">Обкладинка (URL-посилання)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="https://приклад.com/картинка.jpg" 
            value={form.cover}
            onChange={(e) => setForm({...form, cover: e.target.value})} 
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Скасувати</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Збереження...' : (comic ? 'Оновити' : 'Створити')}
          </button>
        </div>
      </div>
    </div>
  );
}