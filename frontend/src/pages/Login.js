import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      addToast('Ласкаво просимо!');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Помилка входу', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: 20 }}>
      <div className="modal" style={{ maxWidth: 420, width: '100%' }}>
        <div className="modal-title" style={{ textAlign: 'center', marginBottom: 8 }}>📖 Вхід</div>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, fontSize: 14 }}>Увійдіть до свого акаунту AngusReader</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 20 }}>
          Немає акаунту? <Link to="/register" style={{ color: 'var(--accent)' }}>Зареєструватись</Link>
        </p>
      </div>
    </div>
  );
}
