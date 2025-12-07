import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KonvaCanva from './KonvaCanva';

// Mock de fetch global
global.fetch = jest.fn();

const mockNavigate = jest.fn();

describe('KonvaCanva Integration', () => {
  
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('Loads schematic data and renders correctly', async () => {
    // --- SETUP DU MOCK INTELLIGENT ---
    (global.fetch as jest.Mock).mockImplementation((url) => {
      
      if (url.includes('/locks/placed_ids/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ placed_lock_ids: [] }),
        });
      }

      if (url.includes('/buildings/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            buildings: [{ id: 1, name: "Batiment Test", floor: 1 }] 
          }),
        });
      }

      if (url.includes('/data/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            components: [
              { id: "wall-1", type: "wall", points: [0,0,100,0], x: 0, y: 0 },
              { id: "slock-1", type: "lock", lock_id: 101, lock_name: "Serrure Test", x: 50, y: 50 }
            ],
            available_locks: [
              { id_lock: 101, name: "Serrure Test", status: "connected" }
            ]
          }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    // --- EXECUTION ---
    render(<KonvaCanva onNavigate={mockNavigate} schematicId={1} />);

    // --- VERIFICATIONS ---
    // Attendre que le mur apparaisse (signe que le chargement est fini)
    await waitFor(() => {
      expect(screen.getByTestId('konva-line')).toBeInTheDocument();
    });

    // Vérifier les éléments
    expect(screen.getByTestId('konva-path')).toBeInTheDocument();
    
    // CORRECTION ICI : On utilise getAllByText car le texte apparaît 2 fois
    // (une fois dans la sidebar, une fois sur le canvas mocké)
    const lockTexts = screen.getAllByText('Serrure Test');
    expect(lockTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('Save button sends correct data to backend', async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (options && options.method === 'POST' && url.includes('/save/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: "success", message: "Saved" }),
        });
      }
      
      // Mocks GET par défaut
      if (url.includes('/buildings/')) return Promise.resolve({ ok: true, json: async () => ({ buildings: [] }) });
      if (url.includes('/data/')) return Promise.resolve({ ok: true, json: async () => ({ components: [], available_locks: [] }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<KonvaCanva onNavigate={mockNavigate} schematicId={1} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Le bouton peut s'appeler "Save" ou "Backup..." selon l'état
    const saveButton = screen.getByRole('button', { name: /save|backup/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const postCall = calls.find((call: any[]) => call[1] && call[1].method === 'POST');
      expect(postCall).toBeTruthy();
      expect(postCall[0]).toContain('/save/');
      expect(JSON.parse(postCall[1].body)).toHaveProperty('components');
    });
  });
});