import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sync dark mode class with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load initial history from backend if backend is running, or fall back to local session state
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.warn("Backend server not reachable. Using local session history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const addPrediction = (prediction) => {
    setHistory((prev) => [prediction, ...prev]);
  };

  const clearHistory = async () => {
    setHistory([]);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/history/clear`, { method: 'POST' });
    } catch (e) {
      console.warn("Backend server not reachable to clear history.");
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        darkMode,
        toggleDarkMode,
        history,
        addPrediction,
        clearHistory,
        refreshHistory: fetchHistory,
        loadingHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
