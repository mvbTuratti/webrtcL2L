import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './output.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Lobby from './components/conference/Lobby.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
  },
  {
    path: "/lobby/:roomId",
    element: <Lobby></Lobby>,
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
