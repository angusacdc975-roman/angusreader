import { useState } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function ChapterModal({ comicId, chaptersCount, onClose, onSaved }) {
  const [num, setNum] = useState(chaptersCount + 1);
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  const validate = () => {
    const e = {};
    if (!num || num < 1) e.num = 'Номер розділу обов\'язковий';
    if (files.length === 0) e.files = 'Додайте хоча б одну сторінку';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('number', num);
      fd.append('title', title);
      Array.from(files).forEach(f => fd.append('pages', f));
      await api.post(`/comics/${comicId}/chapters`, fd);
      addToast('Розділ додано!');
      onSaved();
    } catch (err) {
      addToast(err.response?.data?.message || 'Помилка', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">📄 Додати розділ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Номер *</label>
            <input className="form-input" type="number" value={num} onChange={e => setNum(e.target.value)} />
            {errors.num && <div className="form-error">{errors.num}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Назва (необов'язково)</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Назва розділу..." />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Сторінки (зображення) *</label>
          <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} style={{ color: 'var(--text-secondary)', fontSize: 14 }} />
          {files.length > 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Вибрано: {files.length} файлів</div>}
          {errors.files && <div className="form-error">{errors.files}</div>}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Скасувати</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Завантаження...' : 'Додати'}
          </button>
        </div>
      </div>
    </div>
  );
}
