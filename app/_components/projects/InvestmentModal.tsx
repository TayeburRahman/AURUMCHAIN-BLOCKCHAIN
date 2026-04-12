/**
 * Component: InvestmentModal
 * Modal for creating a new investment in a project
 */

'use client';

import { useState } from 'react';
import { useEligibility } from '@/lib/domains/shared/hooks/useEligibility';
import type { Project, Offering } from '@/lib/domains/projects/models';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  offering: Offering | null;
}

export function InvestmentModal({ isOpen, onClose, project, offering }: InvestmentModalProps) {
  const { canInvest, status, requiredSteps } = useEligibility();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const investmentAmount = parseFloat(amount) || 0;
  const tokenPrice = offering ? Number(offering.tokenPrice) : 0;
  const tokensToReceive = tokenPrice > 0 ? investmentAmount / tokenPrice : 0;
  const minInvestment = Number(project.minInvestment) || 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canInvest) {
      setError('You are not eligible to invest. Please complete required steps.');
      return;
    }

    if (investmentAmount < minInvestment) {
      setError(`Minimum investment is $${minInvestment}`);
      return;
    }

    if (!offering || !offering.availableTokens) {
      setError('This offering is not available');
      return;
    }

    if (tokensToReceive > Number(offering.availableTokens)) {
      setError('Not enough tokens available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/investments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          offeringId: offering.id,
          amount: investmentAmount,
          tokensPurchased: tokensToReceive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create investment');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.href = '/dashboard/investments';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create investment');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-navy-dark rounded-2xl border-2 border-gold/30 shadow-2xl shadow-gold/20 max-w-lg w-full p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Success State */}
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Investment Created!</h3>
              <p className="text-gray-300">Redirecting to your investments...</p>
            </div>
          ) : !canInvest ? (
            /* Not Eligible */
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Complete These Steps First</h2>
              <p className="text-gray-300 mb-6">
                To invest in this project, you need to complete the following:
              </p>

              <div className="space-y-3 mb-6">
                {requiredSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gold">{index + 1}</span>
                    </div>
                    <span className="text-gray-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-400 mb-4">
                Current status: <span className="text-gold capitalize">{status.replace(/_/g, ' ')}</span>
              </p>

              <button
                onClick={() => window.location.href = '/dashboard/settings?tab=verification'}
                className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 rounded-lg"
              >
                Go to Verification
              </button>
            </div>
          ) : (
            /* Investment Form */
            <form onSubmit={handleSubmit}>
              <h2 className="text-2xl font-bold text-white mb-2">Invest in {project.name}</h2>
              <p className="text-gray-400 text-sm mb-6">{project.location}, {project.country}</p>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Investment Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-navy border-2 border-gold/30 rounded-lg py-3 px-10 text-white focus:border-gold focus:outline-none"
                    placeholder="0.00"
                    min={minInvestment}
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Minimum: ${minInvestment.toLocaleString()}
                </p>
              </div>

              {/* Token Calculation */}
              {investmentAmount >= minInvestment && offering && (
                <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">You will receive</div>
                      <div className="text-xl font-bold text-gold">{tokensToReceive.toFixed(4)} tokens</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Token Price</div>
                      <div className="text-xl font-bold text-white">${tokenPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gold/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Available Tokens</span>
                      <span className="text-white">{Number(offering.availableTokens).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || investmentAmount < minInvestment}
                className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : `Invest $${investmentAmount.toLocaleString()}`}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By investing, you agree to our Terms of Service and understand the risks involved.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
