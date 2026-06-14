import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/catalog?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">Angus<span>Reader</span></Link>

      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text" placeholder="Пошук коміксів..."
          value={q} onChange={e => setQ(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </form>

      <div className="navbar-actions">
        <Link to="/catalog" className="btn btn-ghost btn-sm">Каталог</Link>
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-ghost btn-sm">⚙️ Адмін</Link>
            )}
            <Link to="/profile" className="btn btn-ghost btn-sm"> {user.username}</Link>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Вийти</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Увійти</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Реєстрація</Link>
          </>
        )}
      </div>
    </nav>
  );
}
