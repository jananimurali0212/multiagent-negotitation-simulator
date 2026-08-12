import React, { useEffect, useRef } from 'react';
import { NegotiationMessage } from '../../types/negotiation';
import { MessageBubble } from './MessageBubble';
import { MessageSquare, Sparkles } from 'lucide-react';

interface ConversationFeedProps {
  messages: NegotiationMessage[];
  isWaitingForAgent?: boolean;
}

export function ConversationFeed({ messages, isWaitingForAgent = false }: ConversationFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForAgent]);

  return (
    <div className="bg-slate-50/50 rounded-xl border border-slate-200 h-[560px] flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Negotiation Dialogue Feed
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {messages.length} Exchanges Recorded
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <Sparkles className="w-8 h-8 mb-2 text-slate-300 animate-pulse" />
            <p className="text-sm font-medium text-slate-600">Initializing negotiation protocol...</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Autonomous agents are calculating initial utility positions and strategy baselines.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isWaitingForAgent && (
              <div className="p-3 bg-white/80 rounded-xl border border-dashed border-slate-200 mr-12 flex items-center gap-2.5 text-xs text-slate-500 animate-pulse">
                <Sparkles className="w-4 h-4 text-violet-500 animate-spin" />
                <span>Agent calculating next counter-position...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
