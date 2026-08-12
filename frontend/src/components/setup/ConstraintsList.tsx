import React, { useState } from 'react';
import { Constraint } from '../../types/negotiation';
import { ShieldAlert, Lock, Trash2, Plus, Check } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface ConstraintsListProps {
  constraints: Constraint[];
  isEditable?: boolean;
  onAddConstraint?: (constraint: Constraint) => void;
  onRemoveConstraint?: (constraintId: string) => void;
}

export function ConstraintsList({
  constraints,
  isEditable = false,
  onAddConstraint,
  onRemoveConstraint,
}: ConstraintsListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleCreateConstraint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    if (onAddConstraint) {
      onAddConstraint({
        id: `constraint-custom-${Date.now()}`,
        description: newDescription.trim(),
        value: newValue.trim() || 'Custom non-violable limit',
      });
    }

    setNewDescription('');
    setNewValue('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      {constraints.map((c) => (
        <div
          key={c.id}
          className="p-3.5 bg-amber-50/30 rounded-xl border border-amber-200/80 shadow-xs flex items-start justify-between gap-3 group hover:border-amber-300 transition-colors"
        >
          <div className="flex items-start gap-2.5 flex-1">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-950 leading-relaxed">
                {c.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded">
                  {c.value || 'Scenario-defined limit'}
                </span>
                <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                  <Lock className="w-2.5 h-2.5" /> Hard Limit
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="warning" size="sm">
              Strict Boundary
            </Badge>
            {isEditable && onRemoveConstraint && constraints.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveConstraint(c.id)}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Remove Constraint"
                aria-label="Remove Constraint"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Constraint Form / Trigger */}
      {isEditable && onAddConstraint && (
        <div className="pt-1">
          {isAdding ? (
            <form
              onSubmit={handleCreateConstraint}
              className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-300 space-y-3 animate-in fade-in duration-150"
            >
              <span className="text-xs font-bold text-amber-950 block">Add Hard Boundary Constraint</span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Constraint Rule
                </label>
                <input
                  type="text"
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Cannot commit to delivery timelines before Q4 fiscal year"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hard Limit / Ceiling / Floor Value
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. Scenario-defined limit ($43,000 margin floor)"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Save Constraint
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 border border-dashed border-amber-400 text-amber-900 hover:bg-amber-50/70 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Constraint</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
