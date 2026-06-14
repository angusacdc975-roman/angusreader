import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ComicModal from '../components/ComicModal';
import DeleteModal from '../components/DeleteModal';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [comics, setComics] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [editComic, setEditComic] = useState(null);
  const [deleteComic, setDeleteComic] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => { if (!user || user.role !== 'admin') navigate('/'); }, [user, navigate]);

  const load = () => {
    setLoading(true);
    api.get('/comics', { params: { search, status, limit: 100 } })
      .then(r => setComics(r.data.comics))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search, status]);

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/comics/${deleteComic._id}`);
      addToast('Видалено!'); setDeleteComic(null); load();
    } catch { addToast('Помилка', 'error'); }
    finally { setDelLoading(false); }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">⚙️ Адмін-панель</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Додати комікс</button>
      </div>

      <div className="filter-bar">
        <input className="filter-input" placeholder="🔍 Пошук..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Всі статуси</option>
          <option value="ongoing">Виходить</option>
          <option value="completed">Завершено</option>
          <option value="hiatus">Пауза</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"/></div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Фото</th>
                <th>Назва ↑</th>
                <th>Жанри</th>
                <th>Статус</th>
                <th>Розділи ↑</th>
                <th>Перегляди ↑</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {comics.map(c => (
                <tr key={c._id}>
                  <td>{c.cover ? <img src={c.cover} alt={c.title} /> : '📚'}</td>
                  <td style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate(`/comic/${c._id}`)}>{c.title}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.genres?.slice(0,2).join(', ')}</td>
                  <td><span className={`comic-card-status status-${c.status}`} style={{ position: 'static', fontSize: 11 }}>{c.status}</span></td>
                  <td>{c.chapters?.length || 0}</td>
                  <td>{c.views || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditComic(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteComic(c)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comics.length === 0 && <div className="empty-state"><div className="empty-state-text">Нічого не знайдено</div></div>}
        </div>
      )}

      {(showCreate || editComic) && (
        <ComicModal comic={editComic} onClose={() => { setShowCreate(false); setEditComic(null); }} onSaved={() => { setShowCreate(false); setEditComic(null); load(); }} />
      )}
      {deleteComic && <DeleteModal title={deleteComic.title} onClose={() => setDeleteComic(null)} onConfirm={handleDelete} loading={delLoading} />}
    </div>
  );
}
