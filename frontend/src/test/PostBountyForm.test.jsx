import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostBountyForm from '../components/PostBountyForm';

describe('PostBountyForm', () => {
  it('disables submit until all fields are filled', () => {
    render(<PostBountyForm onPost={vi.fn()} loading={false} />);
    expect(screen.getByText('Pin to the board')).toBeDisabled();
  });

  it('calls onPost with converted numeric reward', async () => {
    const onPost = vi.fn();
    render(<PostBountyForm onPost={onPost} loading={false} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Fix onboarding docs typo'), 'Write API docs');
    await user.type(screen.getByPlaceholderText(/setup guide references/i), 'Document the new endpoints');
    await user.type(screen.getByPlaceholderText('50'), '80');
    await user.click(screen.getByText('Pin to the board'));

    expect(onPost).toHaveBeenCalledWith({ title: 'Write API docs', description: 'Document the new endpoints', rewardAmount: 800000000 });
  });

  it('shows the loading label while submitting', () => {
    render(<PostBountyForm onPost={vi.fn()} loading={true} />);
    expect(screen.getByText('Pinning & depositing…')).toBeInTheDocument();
  });
});
