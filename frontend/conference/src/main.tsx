//main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import {NextUIProvider} from '@nextui-org/react'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
// import Lobby from './components/conference/Lobby.tsx';
import Lobby from './components/Figma/FigmaTest.tsx'
import TestC from './components/Figma/TestC.tsx'
import ConferenceRoom from './components/Room/ConferenceRoom.tsx';
import { VideoCameraContext } from './components/Figma/FigmaTest';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
  },
  {
    path: "/test",
    element: <TestC></TestC>,
  },
  {
    path: "/lobby/:roomId",
    element: <Lobby></Lobby>
  },
  {
    path: "/room/:roomId",
    element: <ConferenceRoom />
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NextUIProvider>
      {/* 2. Envolva toda a aplicação com o Provider */}
      <VideoCameraContext.Provider>
        <main className="dark text-foreground bg-background h-[100vh] w-[100vw] flex justify-center items-center overflow-hidden">
          <RouterProvider router={router} />
        </main>
      </VideoCameraContext.Provider>
    </NextUIProvider>
  </React.StrictMode>,
)
