import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// 1. Mock de Konva (pour éviter les erreurs de syntaxe)
jest.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div data-testid="stage">{children}</div>,
  Layer: ({ children }: any) => <div data-testid="layer">{children}</div>,
  Line: () => <div />,
  Path: () => <div />,
  Transformer: () => <div />,
  Text: () => <div />
}));
jest.mock('konva', () => ({}));

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