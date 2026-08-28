import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { negotiationApi, apiRequest, TurnResultResponse } from '../lib/api';
import {
  Send,
  Sparkles,
  User,
  Bot,
  Square,
  AlertCircle,
  MessageSquare,
  Zap,
  Target,
  ShieldAlert,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  round?: number;
  offerData?: Record<string, any>;
}

export const PracticeArenaScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedScenario, configuredAgents, setSelectedReportId, humanRole } = useStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [status, setStatus] = useState<'setup' | 'running' | 'finished' | 'deadlock' | 'terminated'>('running');
  const [errorMessage, setErrorMessage] = useState('');

  const feedRef = useRef<HTMLDivElement>(null);

  const isHumanAgent0 = humanRole === 'buyer' || humanRole === 'recruiter' || humanRole === 'department-head';

  const userAgent = isHumanAgent0
    ? configuredAgents[0] || selectedScenario?.defaultAgents?.[0] || { name: 'You', role: 'Player', avatar: 'YOU' }
    : configuredAgents[1] || selectedScenario?.defaultAgents?.[1] || { name: 'You', role: 'Player', avatar: 'YOU' };

  const opponent = isHumanAgent0
    ? configuredAgents[1] || selectedScenario?.defaultAgents?.[1] || { name: 'AI Opponent', role: 'Opponent', avatar: 'AI' }
    : configuredAgents[0] || selectedScenario?.defaultAgents?.[0] || { name: 'AI Opponent', role: 'Opponent', avatar: 'AI' };

  // Initialize session
  useEffect(() => {
    if (!selectedScenario) return;

    let isMounted = true;
    setIsSubmitting(true);
    setErrorMessage('');

    negotiationApi
      .createSession({
        scenario_id: selectedScenario.id,
        mode: 'human-ai',
        human_role: humanRole || (selectedScenario.id === 'job-offer' ? 'candidate' : 'buyer'),
      })
      .then(async (res) => {
        if (!isMounted) return;
        setSessionId(res.id);
        setCurrentRound(res.current_round || 1);

        const aiSpeaksFirst = !isHumanAgent0;
        if (aiSpeaksFirst) {
          try {
            await apiRequest(`/negotiations/${res.id}/confirm-review`, {
              method: 'POST',
              body: JSON.stringify({ confirm: true }),
            });
            await apiRequest(`/negotiations/${res.id}/start`, { method: 'POST' });
            const stepRes = await negotiationApi.executeStep(res.id);
            if (isMounted && stepRes.message) {
              setMessages([
                {
                  id: stepRes.message.id || `msg-${Date.now()}`,
                  sender: stepRes.message.sender || opponent.name,
                  role: stepRes.message.role || opponent.role,
                  content: stepRes.message.content,
                  isUser: stepRes.message.is_user || false,
                  round: stepRes.message.round || 1,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  offerData: stepRes.message.offer_data,
                },
              ]);
              setCurrentRound(stepRes.round || 1);
              setStatus(stepRes.status as any);
            }
          } catch (err: any) {
            console.error('Opening turn error:', err);
            setErrorMessage(err.message || 'Failed to initialize AI opening turn.');
          } finally {
            if (isMounted) setIsSubmitting(false);
          }
        } else {
          setMessages([
            {
              id: 'init-1',
              sender: opponent.name,
              role: opponent.role,
              content: `Hello! I am ${opponent.name}, acting as ${opponent.role}. I am ready to negotiate. Please share your opening proposal or offer terms.`,
              isUser: false,
              round: 1,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsSubmitting(false);
        }
      })
      .catch((err) => {
        console.error('Backend negotiation creation error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to connect to backend for negotiation setup.');
          setStatus('terminated');
          setIsSubmitting(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedScenario]);

  // Scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length, isSubmitting]);

  // Handle user send turn
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting || status === 'finished' || status === 'terminated' || !sessionId) return;

    const userMessageContent = inputText.trim();
    setInputText('');
    setErrorMessage('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'You',
      role: userAgent.role,
      content: userMessageContent,
      isUser: true,
      round: currentRound,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setIsSubmitting(true);

    try {
      const turnRes = await negotiationApi.submitUserTurn(sessionId, userMessageContent);

      if (turnRes.validation_error) {
        setErrorMessage(turnRes.validation_error);
        setInputText(userMessageContent); // Preserve user input for correction
        return;
      }

      setMessages((prev) => [...prev, userMsg]);
      setCurrentRound(turnRes.round || currentRound);
      if (turnRes.status) {
        setStatus(turnRes.status as any);
      }

      if (turnRes.message) {
        const aiMsg: ChatMessage = {
          id: turnRes.message.id || `ai-${Date.now()}`,
          sender: turnRes.message.sender || opponent.name,
          role: turnRes.message.role || opponent.role,
          content: turnRes.message.content,
          isUser: turnRes.message.is_user || false,
          round: turnRes.message.round,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          offerData: turnRes.message.offer_data,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      console.error('Submit turn error:', err);
      setErrorMessage(err.message || 'Failed to submit offer to AI opponent.');
      setInputText(userMessageContent); // Preserve user input on network error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopNegotiation = async () => {
    if (!sessionId) return;
    try {
      await apiRequest(`/negotiations/${sessionId}/stop`, { method: 'POST' });
    } catch (err) {
      console.warn('Stop session fallback:', err);
    } finally {
      setStatus('terminated');
      navigate('/reports');
    }
  };

  if (!selectedScenario) {
    return (
      <div className="min-h-screen bg-[#EEF1F8] flex items-center justify-center p-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl shadow-xl p-10 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <MessageSquare size={26} />
          </div>
          <h3 className="text-lg font-bold text-[#14234D]">No Scenario Loaded</h3>
          <p className="text-sm text-slate-500">Please select a negotiation scenario before entering the practice arena.</p>
          <button
            onClick={() => navigate('/setup/scenario')}
            className="px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all border-none cursor-pointer"
          >
            Select Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[#14234D] pb-8 w-full">
      <div
        className="rounded-[24px] border p-6 md:p-8 space-y-6"
        style={{
          background: 'rgba(255,255,255,0.58)',
          borderColor: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 12px 40px rgba(15,23,42,0.03)',
        }}
      >
        {/* HEADER BAR */}
        <section className="rounded-[22px] border border-white/90 bg-white/80 backdrop-blur-xl shadow-[0_10px_35px_rgba(46,65,110,0.06)] px-6 py-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Scenario</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <h2 className="text-[15px] font-bold text-[#14234D]">{selectedScenario.title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200 uppercase tracking-wider">
                    Human vs AI Practice
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Opponent</p>
                <p className="text-[13px] font-semibold text-[#14234D] mt-1">{opponent.name} ({opponent.role})</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Round</p>
                <p className="text-[13px] font-semibold text-[#14234D] mt-1">Round {currentRound} / 20</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-700">{status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={() => setIsSubmitting((prev) => !prev)}
                disabled={status === 'finished' || status === 'deadlock' || status === 'terminated'}
                className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                } disabled:opacity-50`}
              >
                <span>{isSubmitting ? 'Resume Input' : 'Pause Input'}</span>
              </button>

              <button
                onClick={handleStopNegotiation}
                className="px-4 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop Negotiation</span>
              </button>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2 font-semibold animate-in fade-in">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MAIN LAYOUT: LEFT SIDEBAR | CENTER CHAT | RIGHT SIDEBAR */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-6 items-start">
          {/* LEFT SIDEBAR: PROFILES */}
          <div className="space-y-4">
            <aside className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Opponent</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {opponent.avatar || 'AI'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14234D]">{opponent.name}</h3>
                  <p className="text-[11px] text-orange-600 font-semibold">{opponent.role}</p>
                </div>
              </div>
            </aside>

            <aside className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Role</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  YOU
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14234D]">You (Player)</h3>
                  <p className="text-[11px] text-blue-600 font-semibold">{userAgent.role}</p>
                </div>
              </div>
            </aside>
          </div>

          {/* CENTER CHAT INTERFACE FOR HUMAN VS AI */}
          <section className="bg-white/75 border border-white/90 rounded-[24px] shadow-[0_12px_40px_rgba(15,23,42,0.05)] overflow-hidden min-h-[580px] flex flex-col backdrop-blur-[24px]">
            {/* CHAT HEADER */}
            <div className="px-6 py-3.5 border-b border-slate-100 bg-white/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <MessageSquare size={15} className="text-blue-600" />
                <span>Interactive Practice Chat</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Live Turn Response
              </span>
            </div>

            {/* CHAT FEED */}
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:18px_18px]"
            >
              {messages.map((msg) => {
                const isUser = msg.isUser;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
                  >
                    {/* Left AI Avatar */}
                    {!isUser && (
                      <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                        {opponent.avatar || 'AI'}
                      </div>
                    )}

                    {/* Chat Bubble */}
                    <div className="space-y-1.5 max-w-[80%] md:max-w-[70%]">
                      <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-bold text-[11px] text-[#14234D]">{msg.sender}</span>
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl border shadow-sm ${
                          isUser
                            ? 'bg-blue-600 text-white border-blue-600 rounded-tr-none'
                            : 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed text-[12px] whitespace-pre-line">{msg.content}</p>

                        {/* Structured offer data badges if available */}
                        {msg.offerData && Object.keys(msg.offerData).length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-2 text-[10px] font-bold">
                            {Object.entries(msg.offerData).map(([k, v]) => (
                              <span
                                key={k}
                                className={`px-2.5 py-1 rounded-lg border ${
                                  isUser
                                    ? 'bg-blue-700/80 text-white border-blue-500'
                                    : 'bg-orange-100/80 text-orange-800 border-orange-200'
                                }`}
                              >
                                {k}: <span className="font-extrabold">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right User Avatar */}
                    {isUser && (
                      <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                        YOU
                      </div>
                    )}
                  </div>
                );
              })}

              {/* TYPING / LOADING ANIMATION FOR AI RESPONSE */}
              {isSubmitting && (
                <div className="flex gap-3 text-xs justify-start items-center animate-pulse">
                  <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    {opponent.avatar || 'AI'}
                  </div>
                  <div className="p-3.5 bg-orange-50/90 border border-orange-100 rounded-2xl rounded-tl-none flex items-center gap-3">
                    <span className="text-[11px] text-orange-800 font-semibold">
                      {opponent.name} is evaluating your offer...
                    </span>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM CHAT INPUT BAR */}
            <div className="p-4 border-t border-slate-100 bg-white/80 backdrop-blur-md">
              <form onSubmit={handleSend} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    status === 'finished' || status === 'terminated'
                      ? 'Negotiation session complete.'
                      : 'Type your negotiation offer or counter-response...'
                  }
                  disabled={status === 'finished' || status === 'terminated' || isSubmitting}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || status === 'finished' || status === 'terminated' || isSubmitting}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 shrink-0 border-none cursor-pointer flex items-center gap-2"
                >
                  <span>Send</span>
                  <Send size={14} />
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT SIDEBAR: PRIVATE TARGETS */}
          <aside className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-4">
            <h3 className="font-bold text-xs text-[#14234D] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Target size={15} className="text-blue-600" />
              Your Private Reference Bounds
            </h3>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              {userAgent.targetPrice && (
                <div className="flex justify-between items-center p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span>Target Price:</span>
                  <span className="text-blue-700 font-bold">
                    {userAgent.currency || '$'}
                    {userAgent.targetPrice}
                  </span>
                </div>
              )}
              {userAgent.maxBudget && (
                <div className="flex justify-between items-center p-2.5 bg-red-50/60 rounded-xl border border-red-100">
                  <span>Maximum Budget:</span>
                  <span className="text-red-600 font-bold">
                    {userAgent.currency || '$'}
                    {userAgent.maxBudget}
                  </span>
                </div>
              )}
              {userAgent.minPrice && (
                <div className="flex justify-between items-center p-2.5 bg-red-50/60 rounded-xl border border-red-100">
                  <span>Min Price Floor:</span>
                  <span className="text-red-600 font-bold">
                    {userAgent.currency || '$'}
                    {userAgent.minPrice}
                  </span>
                </div>
              )}

              {userAgent.goals && userAgent.goals.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1.5">Key Goals</span>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] font-medium text-slate-600">
                    {userAgent.goals.map((g: any) => g.text && <li key={g.id || g.text}>{g.text}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PracticeArenaScreen;
