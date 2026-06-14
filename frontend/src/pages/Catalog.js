import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ComicCard from '../components/ComicCard';
import ComicModal from '../components/ComicModal';
import DeleteModal from '../components/DeleteModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Catalog() {
  const [comics, setComics] = useState([]);
  const [genres, setGenres] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [editComic, setEditComic] = useState(null);
  const [deleteComic, setDeleteComic] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  const search = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const page = Number(searchParams.get('page') || 1);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/comics', { params: { search, genre, status, sort, page, limit: 20 } })
      .then(r => { setComics(r.data.comics); setPagination({ page: r.data.page, pages: r.data.pages, total: r.data.total }); })
      .finally(() => setLoading(false));
  }, [search, genre, status, sort, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { api.get('/comics/genres').then(r => setGenres(r.data)); }, []);

  const set = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/comics/${deleteComic._id}`);
      addToast('Комікс видалено!');
      setDeleteComic(null);
      fetch();
    } catch { addToast('Помилка', 'error'); }
    finally { setDelLoading(false); }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Каталог {pagination.total > 0 && <span style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'Nunito' }}>({pagination.total})</span>}</h2>
        {user?.role === 'admin' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Додати комікс</button>
        )}
      </div>

      <div className="filter-bar">
        <input className="filter-input" placeholder="🔍 Пошук..." value={search} onChange={e => set('search', e.target.value)} />
        <select className="filter-select" value={genre} onChange={e => set('genre', e.target.value)}>
          <option value="">Всі жанри</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e => set('status', e.target.value)}>
          <option value="">Всі статуси</option>
          <option value="ongoing">Виходить</option>
          <option value="completed">Завершено</option>
          <option value="hiatus">Пауза</option>
        </select>
        <select className="filter-select" value={sort} onChange={e => set('sort', e.target.value)}>
          <option value="-createdAt">Нові</option>
          <option value="-views">Популярні</option>
          <option value="-updatedAt">Оновлені</option>
          <option value="title">Назва А-Я</option>
          <option value="-rating">Рейтинг</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"/></div>
      ) : comics.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🔍</div><div className="empty-state-text">Нічого не знайдено</div></div>
      ) : (
        <div className="comics-grid">
          {comics.map(c => (
            <ComicCard key={c._id} comic={c} onEdit={() => setEditComic(c)} onDelete={() => setDeleteComic(c)} />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => set('page', page - 1)}>‹</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === pagination.pages)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i-1] > 1) acc.push('...');
              acc.push(p); return acc;
            }, [])
            .map((p, i) => p === '...'
              ? <span key={`e${i}`} className="page-btn" style={{ cursor: 'default' }}>…</span>
              : <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => set('page', p)}>{p}</button>
            )}
          <button className="page-btn" disabled={page >= pagination.pages} onClick={() => set('page', page + 1)}>›</button>
        </div>
      )}

      {(showCreate || editComic) && (
        <ComicModal comic={editComic} onClose={() => { setShowCreate(false); setEditComic(null); }} onSaved={() => { setShowCreate(false); setEditComic(null); fetch(); }} />
      )}
      {deleteComic && (
        <DeleteModal title={deleteComic.title} onClose={() => setDeleteComic(null)} onConfirm={handleDelete} loading={delLoading} />
      )}
    </div>
  );
}
