import React from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Header from './components/Header';
import Register from './components/Register';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Auth />;

  return (
    <div className="App">
      <Header />
      <Register />
    </div>
  );
}

export default App;
