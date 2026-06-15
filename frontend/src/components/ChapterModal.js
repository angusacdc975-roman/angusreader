import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function ChapterModal({ comicId, chapter, onClose, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ number: '', title: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Якщо передали існуючий розділ, заповнюємо поля його даними
  useEffect(() => {
    if (chapter) {
      setForm({ number: chapter.number || '', title: chapter.title || '' });
    }
  }, [chapter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.number === '') return addToast('Вкажіть номер розділу', 'error');
    
    // Якщо створюємо новий розділ, файли обов'язкові. При редагуванні - ні.
    if (!chapter && files.length === 0) {
      return addToast('Виберіть хоча б одну сторінку!', 'error');
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('number', form.number);
      fd.append('title', form.title);
      
      // Додаємо всі вибрані файли у FormData під ім'ям 'pages'
      if (files.length > 0) {
        Array.from(files).forEach(file => {
          fd.append('pages', file);
        });
      }

      // Відправляємо запит: PUT для редагування, POST для створення
      if (chapter) {
        await api.put(`/comics/${comicId}/chapters/${chapter._id}`, fd);
        addToast('Розділ успішно оновлено!', 'success');
      } else {
        await api.post(`/comics/${comicId}/chapters`, fd);
        addToast('Новий розділ додано!', 'success');
      }
      
      onSaved(); // Оновлюємо сторінку коміксу
      onClose(); // Закриваємо модалку
    } catch (err) {
      addToast(err.response?.data?.message || 'Помилка збереження', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-title">
          {chapter ? ' Редагувати розділ' : '➕ Додати розділ'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label className="form-label">Номер розділу *</label>
            <input 
              type="number" 
              className="form-input" 
              value={form.number} 
              onChange={e => setForm({...form, number: e.target.value})} 
              placeholder="Наприклад: 1" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Назва розділу (необов'язково)</label>
            <input 
              type="text" 
              className="form-input" 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              placeholder="Наприклад: Початок" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Сторінки (Зображення)
              {chapter && <span style={{fontSize: '12px', color: '#888', marginLeft: '10px'}}>Залиште порожнім, щоб не змінювати старі</span>}
            </label>
            <input 
              type="file" 
              multiple // Дозволяємо вибирати багато файлів
              accept="image/*"
              className="form-input" 
              onChange={(e) => setFiles(e.target.files)} 
            />
            {files.length > 0 && <small style={{color: '#4ade80'}}>{files.length} файлів вибрано</small>}
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Скасувати
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Збереження...' : (chapter ? 'Оновити' : 'Створити')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}