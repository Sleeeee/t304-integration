import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';


// 2. Mock de Fetch Global
global.fetch = jest.fn();

test('renders login screen by default (unauthenticated)', async () => {
  // On simule que l'appel à /auth/me/ échoue (donc utilisateur non connecté)
  (global.fetch as jest.Mock).mockImplementation((url) => {
    if (url.includes('/auth/me/')) {
      return Promise.resolve({ ok: false }); // 401 Unauthorized
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  // 3. CORRECTION IMPORTANTE :
  // On utilise 'findBy...' qui ATTEND que le spinner disparaisse 
  // et que le texte apparaisse (timeout par défaut de 1000ms).
  const loginButton = await screen.findByText(/Log In/i);
  
  expect(loginButton).toBeInTheDocument();
});