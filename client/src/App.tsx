import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Chat from './views/Chat';
import LoginPage from './views/Login';
import SignupPage from './views/Signup';
import ProtectLayout from './layouts/ProtectLayout';
import HomePage from './views/Home';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/chat',
    element: <ProtectLayout />, // Protect the entire /chat route
    children: [
      {
        path: '', // Empty path means it will match the /chat route itself
        element: <Chat />, // The protected Chat component
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
