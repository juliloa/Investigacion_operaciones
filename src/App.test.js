import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the decision module start screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /configuración del problema/i })).toBeInTheDocument();
});
