import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { PieceCard } from './piece-card';

describe('PieceCard', () => {
  it('is a single link named by the piece, pointing to its page', () => {
    renderWithIntl(
      <PieceCard
        slug="tigela-de-ceramica"
        name="Tigela de cerâmica"
        maker="Dona Lúcia"
        place="SP"
        price="R$ 89"
        material="ceramics"
      />,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/pt/pecas/tigela-de-ceramica');
    expect(link).toHaveTextContent('Tigela de cerâmica');
    expect(screen.getByRole('heading', { name: 'Tigela de cerâmica' })).toBeInTheDocument();
  });

  it('keeps the drawing out of the accessibility tree', () => {
    const { container } = renderWithIntl(
      <PieceCard
        slug="x"
        name="Cesto"
        maker="Seu Raimundo"
        place="PE"
        price="R$ 120"
        material="straw"
      />,
    );
    expect(container.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
