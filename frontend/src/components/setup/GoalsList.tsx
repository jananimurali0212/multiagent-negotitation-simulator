import React, { useState } from 'react';
import { Goal } from '../../types/negotiation';
import { Target, Trash2, Plus, PlusCircle, Check } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface GoalsListProps {
  goals: Goal[];
  isEditable?: boolean;
  onAddGoal?: (goal: Goal) => void;
  onRemoveGoal?: (goalId: string) => void;
}

export function GoalsList({
  goals,
  isEditable = false,
  onAddGoal,
  onRemoveGoal,
}: GoalsListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTargetValue, setNewTargetValue] = useState('');

  const getPriorityBadge = (priority?: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive" size="sm">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="warning" size="sm">Medium Priority</Badge>;
      case 'Low':
        return <Badge variant="secondary" size="sm">Low Priority</Badge>;
      default:
        return <Badge variant="default" size="sm">Target</Badge>;
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    if (onAddGoal) {
      onAddGoal({
        id: `goal-custom-${Date.now()}`,
        description: newDescription.trim(),
        priority: newPriority,
        targetValue: newTargetValue.trim() || undefined,
      });
    }

    setNewDescription('');
    setNewTargetValue('');
    setNewPriority('Medium');
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-start justify-between gap-3 group hover:border-slate-300 transition-colors"
        >
          <div className="flex items-start gap-2.5 flex-1">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {goal.description}
              </p>
              {goal.targetValue && (
                <p className="text-[11px] text-blue-600 font-medium mt-1">
                  Target Value: <strong>{goal.targetValue}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {getPriorityBadge(goal.priority)}
            {isEditable && onRemoveGoal && goals.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveGoal(goal.id)}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Remove Goal"
                aria-label="Remove Goal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Goal Form / Trigger */}
      {isEditable && onAddGoal && (
        <div className="pt-1">
          {isAdding ? (
            <form
              onSubmit={handleCreateGoal}
              className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200 space-y-3 animate-in fade-in duration-150"
            >
              <span className="text-xs font-bold text-blue-900 block">Add Custom Objective</span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Goal Description
                </label>
                <input
                  type="text"
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Secure dedicated technical support and quarterly reviews"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Target Metric / Value (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTargetValue}
                    onChange={(e) => setNewTargetValue(e.target.value)}
                    placeholder="e.g. $45,000 or Tier-1"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                <Button type="submit" size="sm" leftIcon={<Check className="w-3.5 h-3.5" />}>
                  Save Goal
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 border border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Goal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
