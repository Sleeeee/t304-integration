import './App.css';
import { useAuth } from './context/AuthContext';
import Register from './components/Register';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <div>Vous n'êtes pas authentifié</div>;

  return (
    <div className="App">
      <Register />
    </div>
  );
}

export default App;
