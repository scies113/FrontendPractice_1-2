import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await apiClient.post('/auth/register', formData);
      alert('Регистрация успешна! Теперь войдите.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: '50px auto' }}>
        <h2>Регистрация</h2>
        
        {error && (
          <div style={{ color: 'red', marginBottom: 10 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Имя</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Фамилия</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Роль</label>
            <select
              name="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{ width: '100%', padding: 10 }}
            >
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Админ</option>
            </select>
          </div>

          <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
            Зарегистрироваться
          </button>
        </form>

        <p style={{ marginTop: 15, textAlign: 'center' }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}