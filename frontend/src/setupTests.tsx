// frontend/src/setupTests.ts
import '@testing-library/jest-dom';
import React from 'react'; // Ensure React is available for the JSX in mocks

// 1. Mock 'react-konva' to render simple divs instead of Canvas elements
jest.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div data-testid="stage">{children}</div>,
  Layer: ({ children }: any) => <div data-testid="layer">{children}</div>,
  Line: () => <div data-testid="konva-line" />,
  Path: () => <div data-testid="konva-path" />,
  Transformer: () => <div data-testid="konva-transformer" />,
  Text: ({ text }: any) => <div data-testid="konva-text">{text}</div>,
  Image: () => <div data-testid="konva-image" />,
  Group: ({ children }: any) => <div data-testid="konva-group">{children}</div>,
  Circle: () => <div data-testid="konva-circle" />,
  Rect: () => <div data-testid="konva-rect" />,
}));

// 2. Mock 'konva' core to bypass ESM import errors
jest.mock('konva', () => {
  return {
    Konva: {
      isBrowser: false,
    },
  };
});

// 3. Mock window.URL.createObjectURL (often needed by Konva/Canvas interactions)
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: () => 'mock-url' });
}