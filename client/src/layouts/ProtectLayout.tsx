import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const ProtectLayout = () => {
  const navigate = useNavigate();

  const isLoggedIn = () => {
    return !!localStorage.getItem('token');
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);

  return isLoggedIn() ? <Outlet /> : null;
};

export default ProtectLayout;
