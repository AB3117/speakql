import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-100 to-white space-y-6">
      <h1 className="text-5xl font-extrabold text-indigo-600">Welcome to SpeakQL</h1>
      <p className="text-lg text-gray-600 text-center">
        SpeakQL is the ultimate tool for managing and querying your databases with ease. Start your
        journey with us today.
      </p>

      <div className="flex gap-4">
        <Button
          onClick={() => navigate('/login')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
        >
          Login
        </Button>

        <Button
          onClick={() => navigate('/signup')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
