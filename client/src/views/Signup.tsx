import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { requestSignup } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestSignup(username, password);
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-indigo-100 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md space-y-6"
      >
        <h2 className="text-3xl font-bold text-indigo-600 text-center">Sign Up</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <Input
              type="text"
              placeholder="Choose a username"
              className="mt-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Input
              type="password"
              placeholder="Create a password"
              className="mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 mt-4"
          >
            Sign Up
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
