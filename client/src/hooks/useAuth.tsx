import { API_URL } from '@/constants';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

type UseAuthReturns = {
  requestLogin: (username: string, password: string) => void;
  requestSignup: (username: string, password: string) => void;
  requestLogout: () => void;
  isLoggedIn: () => boolean;
};

function useAuth(): UseAuthReturns {
  const navigate = useNavigate();

  const requestLogin = async (username: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      localStorage.setItem('token', res.data.access_token);

      toast.success(`Welcome back, ${username}!`);
      navigate('/chat');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
      console.log(error);
    }
  };

  const requestSignup = async (username: string, password: string) => {
    try {
      await axios.post(`${API_URL}/signup`, { username, password });

      toast.success('Signup successful! You can now log in.');
      navigate('/login');
    } catch (error) {
      toast.error('Signup failed. Try a different username.');
      console.log(error);
    }
  };

  const requestLogout = () => {
    localStorage.removeItem('token');

    toast('Logged out successfully.', {
      description: 'Hope to see you again soon!',
    });

    navigate('/login');
  };

  const isLoggedIn = () => {
    return !!localStorage.getItem('token');
  };

  return {
    requestLogin,
    requestSignup,
    requestLogout,
    isLoggedIn,
  };
}

export default useAuth;
