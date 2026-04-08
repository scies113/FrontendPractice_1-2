import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      
      //сохраняем токены и данные пользователя
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('userRole', res.data.user.role);
      localStorage.setItem('userName', res.data.user.first_name);
      localStorage.setItem('userEmail', res.data.user.email);
      
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: '50px auto' }}>
        <h2>Вход в систему</h2>
        
        {error && (
          <div style={{ color: 'red', marginBottom: 10 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Войти
          </button>
        </form>

        <p style={{ marginTop: 15, textAlign: 'center' }}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>

        <div style={{ marginTop: 20, padding: 10, background: '#f0f0f0', borderRadius: 4 }}>
          <small><strong>Тестовые аккаунты:</strong></small><br/>
          <small>Admin: admin@test.ru / admin123</small><br/>
          <small>Moderator: mod@test.ru / mod123</small><br/>
          <small>User: user@test.ru / user123</small>
        </div>
      </div>
    </div>
  );
}