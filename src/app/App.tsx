import React, { useState, useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router';
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ReceiverRegistration } from "./components/ReceiverRegistration";
import { ReceiverList } from "./components/ReceiverList";
import { SenderList } from "./components/SenderList";
import { Login } from "./components/Login";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('erb_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('erb_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('erb_auth');
  };

  const router = createBrowserRouter([
    {
      path: "/login",
      element: !isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Navigate to="/" replace />
      ),
    },
    {
      path: "/",
      element: isAuthenticated ? (
        <Layout onLogout={handleLogout} />
      ) : (
        <Navigate to="/login" replace />
      ),
      children: [
        {
          index: true,
          Component: Dashboard,
        },
        {
          path: "receivers",
          children: [
            {
              index: true,
              Component: ReceiverList,
            },
            {
              path: "new",
              Component: ReceiverRegistration,
            },
          ],
        },
        {
          path: "senders",
          Component: SenderList,
        },
      ],
    },
    {
      path: "*",
      element: <Navigate to={isAuthenticated ? "/" : "/login"} replace />,
    },
  ]);

  return <RouterProvider router={router} />;
}
