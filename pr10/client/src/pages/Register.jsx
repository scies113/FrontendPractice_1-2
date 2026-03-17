import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({ 
    email: '', first_name: '', last_name: '', password: '' 
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/auth/register', formData);
      alert('Регистрация успешна! Теперь войдите.');
      navigate('/login');
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Регистрация</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Email" name="email" onChange={e => setFormData({...formData, email: e.target.value})} required style={{ padding: 8 }} />
        <input placeholder="Имя" name="first_name" onChange={e => setFormData({...formData, first_name: e.target.value})} required style={{ padding: 8 }} />
        <input placeholder="Фамилия" name="last_name" onChange={e => setFormData({...formData, last_name: e.target.value})} required style={{ padding: 8 }} />
        <input type="password" placeholder="Пароль" name="password" onChange={e => setFormData({...formData, password: e.target.value})} required style={{ padding: 8 }} />
        <button type="submit" style={{ padding: 10, background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Зарегистрироваться
        </button>
      </form>
      <p style={{ marginTop: 10 }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}