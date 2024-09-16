import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import {NextUIProvider} from '@nextui-org/react'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Lobby from './components/conference/Lobby.tsx';
import Test from './components/Figma/FigmaTest.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
  },
  {
    path: "/lobby/:roomId",
    element: <Lobby></Lobby>,
  },
  {
    path: "/test",
    element: <Test></Test>
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NextUIProvider>
      <main className="bg-default-800 text-foreground h-[100vh] w-[100vw] flex justify-center items-center overflow-hidden">
        <RouterProvider router={router} />
      </main>
    </NextUIProvider>
  </React.StrictMode>,
)
