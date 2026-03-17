import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  //если токена нет, кидаем на логин
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Защищенный маршрут */}
        <Route 
          path="/products" 
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } 
        />
        
        {/* Редирект с главной страницы */}
        <Route path="/" element={<Navigate to="/products" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;