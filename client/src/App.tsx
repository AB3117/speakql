import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Chat from "./views/Chat";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Chat />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export const API_URL = import.meta.env.VITE_API_URL;
export default App;
