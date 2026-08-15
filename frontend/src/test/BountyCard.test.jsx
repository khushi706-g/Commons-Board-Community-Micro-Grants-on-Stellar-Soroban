import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BountyCard from '../components/BountyCard';

const sampleBounty = {
  poster: 'GPOSTER1111111111111111111111111111111111111111111111',
  title: 'Fix onboarding docs typo',
  description: 'The setup guide has an outdated CLI flag.',
  reward_amount: 100,
  status: 'InReview',
  submissions: [{ contributor: 'GCONTRIB2222222222222222222222222222222222222222222', note: 'Fixed in PR #42' }],
};

describe('BountyCard', () => {
  it('shows an empty state when no bounty is loaded', () => {
    render(<BountyCard bounty={null} currentAddress={null} onAction={vi.fn()} actionLoading={false} />);
    expect(screen.getByText(/no bounty loaded/i)).toBeInTheDocument();
  });

  it('renders title, description, and reward', () => {
    render(<BountyCard bounty={sampleBounty} currentAddress={null} onAction={vi.fn()} actionLoading={false} />);
    expect(screen.getByText('Fix onboarding docs typo')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('lets the poster approve a submission', async () => {
    const onAction = vi.fn();
    render(
      <BountyCard bounty={sampleBounty} currentAddress={sampleBounty.poster} onAction={onAction} actionLoading={false} />
    );
    const user = userEvent.setup();
    await user.click(screen.getByText('Approve & pay out'));
    expect(onAction).toHaveBeenCalledWith('approve', sampleBounty.submissions[0].contributor);
  });
});
