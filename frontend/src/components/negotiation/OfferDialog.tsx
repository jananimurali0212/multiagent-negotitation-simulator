import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NegotiationOffer } from '../../types/negotiation';
import { DollarSign, Tag, FileText } from 'lucide-react';

interface OfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOffer: (content: string, offer: NegotiationOffer) => void;
  scenarioName: string;
  defaultOfferValue?: string;
}

export function OfferDialog({
  isOpen,
  onClose,
  onSubmitOffer,
  scenarioName,
  defaultOfferValue = '$45,000',
}: OfferDialogProps) {
  const [offerValue, setOfferValue] = useState(defaultOfferValue);
  const [offerType, setOfferType] = useState<NegotiationOffer['type']>('counteroffer');
  const [rationale, setRationale] = useState(
    'Based on our market requirements and SLA expectations, this proposal delivers strong mutual value.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerValue.trim()) return;

    const numericMatch = offerValue.replace(/[^0-9]/g, '');
    const numericValue = numericMatch ? parseInt(numericMatch, 10) : undefined;

    onSubmitOffer(rationale, {
      value: offerValue,
      type: offerType,
      numericValue,
      details: rationale,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Formal Negotiation Offer"
      description={`Submit a structured proposal to your AI counterpart in ${scenarioName}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Proposal Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Proposal Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['counteroffer', 'concession', 'final'] as const).map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setOfferType(type)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all ${
                  offerType === type
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Valuation Value Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Offer Amount / Valuation
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={offerValue}
              onChange={(e) => setOfferValue(e.target.value)}
              placeholder="e.g. $45,000"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Accompanying Rationale Message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Accompanying Strategic Rationale
          </label>
          <textarea
            rows={3}
            required
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
            placeholder="State your business justification, conditions, and SLA expectations..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Transmit Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
