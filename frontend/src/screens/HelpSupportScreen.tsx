import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  Award, 
  Mail, 
  MessageSquare, 
  Send,
  PlusCircle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export const HelpSupportScreen: React.FC = () => {
  const { supportTickets, submitTicket } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(0);
  
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    { q: 'How does the AI orchestrator resolve deadlocks?', a: 'If agents repeat terms for two consecutive rounds, the orchestrator triggers the Deadlock Detector. It selects a resolution strategy (concession boost or perspective shift) which injects alternative goals into the agent states to break the cycle.' },
    { q: 'What is the role of experience levels in agent strategies?', a: 'High experience levels enable tactical trading of parameters. For example, trading longer contract term commitment lengths to yield pricing discount concessions.' },
    { q: 'How are practice scores calculated?', a: 'Performance metrics (Active Listening, Argument Strength) evaluate user responses against scenario goals. Formulating counteroffers matching AI limits raises concession control.' }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    
    submitTicket(subject.trim(), category);
    setSubject('');
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
    }, 2500);
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 py-4 pb-8 w-full">
      
      {/* Header */}
      <div className="pb-4 border-b border-gray-200/50">
        <h1 className="text-xl font-bold text-primary tracking-tight">Help & Support</h1>
        <p className="text-xs text-slategray font-medium">Search negotiation guides, browse common questions, or contact developers</p>
      </div>

      {/* Help Search Bar */}
      <div className="relative max-w-lg">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slategray pointer-events-none">
          <Search size={15} />
        </span>
        <input
          type="text"
          placeholder="Search common questions, guides, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-white/85 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-navyblack transition-all"
        />
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.8fr)_minmax(320px,0.85fr)] gap-6">
        
        {/* Left Side: Getting Started, Guides, FAQs (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Getting Started & Negotiation Guide (Simple Visual Blocks) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-2.5">
              <div className="p-2 w-fit bg-primary/5 rounded-xl border border-primary/10">
                <BookOpen size={16} className="text-primary" />
              </div>
              <h3 className="font-semibold text-xs text-primary uppercase tracking-wider">Getting Started Guide</h3>
              <p className="text-[11px] text-slategray leading-relaxed font-semibold">
                Learn how to select pre-configured scenario frameworks, configure agent strategies, adjust personalities, and interpret diagnostic results.
              </p>
            </div>
 
            <div className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-2.5">
              <div className="p-2 w-fit bg-secondary/5 rounded-xl border border-secondary/10">
                <Award size={16} className="text-secondary" />
              </div>
              <h3 className="font-semibold text-xs text-primary uppercase tracking-wider">Negotiation Best Practices</h3>
              <p className="text-[11px] text-slategray leading-relaxed font-semibold">
                Discover tactical concession policies, anchoring limits, and deadlock resolution techniques used by top practitioners.
              </p>
            </div>
          </div>

          {/* Common Questions FAQ Accordion */}
          <div className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-4">
            <div>
              <h3 className="font-semibold text-primary text-sm flex items-center gap-2">
                <HelpCircle className="text-secondary" size={16} />
                Common Questions
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">Self-service answers to frequently asked questions</p>
            </div>

            <div className="divide-y divide-gray-155 border border-gray-150 rounded-xl overflow-hidden text-xs">
              {filteredFaqs.length === 0 ? (
                <p className="p-5 text-center text-slategray">No matching items found.</p>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = activeFaqIdx === idx;
                  return (
                    <div key={idx} className="bg-white">
                      <button
                        onClick={() => setActiveFaqIdx(isOpen ? null : idx)}
                        className="w-full px-5 py-3.5 text-left font-bold text-primary flex items-center justify-between hover:bg-warmpearl/30 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={14} className={`text-slategray transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-slategray leading-relaxed font-medium">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Support channels & Submit ticket form */}
        <div className="space-y-6">
          
          {/* Quick contact support */}
          <div className="bg-white/58 border border-white/70 rounded-[22px] p-5 shadow-[0_8px_32px_rgba(15,23,42,0.03)] backdrop-blur-[20px] space-y-4">
            <div>
              <h3 className="font-semibold text-primary text-xs uppercase tracking-widest">Contact Support</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Escalate inquiries directly to developers</p>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-center gap-3 p-3 bg-warmpearl/60 border border-gray-200/60 rounded-xl">
                <Mail size={15} className="text-secondary shrink-0" />
                <div>
                  <p className="text-primary font-bold">Email Support</p>
                  <p className="text-[10px] text-slategray font-medium mt-0.5">support@arena.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-warmpearl/60 border border-gray-200/60 rounded-xl">
                <MessageSquare size={15} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-primary font-bold">Live Developer Chat</p>
                  <p className="text-[10px] text-slategray font-medium mt-0.5">Average reply time: &lt; 5 minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Submission form */}
          <div className="bg-white/58 border border-white/70 rounded-[22px] p-5 shadow-[0_8px_32px_rgba(15,23,42,0.03)] backdrop-blur-[20px] space-y-4">
            <div>
              <h3 className="font-semibold text-primary text-xs uppercase tracking-widest flex items-center gap-1.5">
                <PlusCircle size={15} className="text-accent" />
                Submit Support Ticket
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">Submit a ticket for compliance analysis</p>
            </div>

            {submitted && (
              <div className="p-3 bg-green-50 border border-green-200/50 text-green-700 text-[10px] rounded-xl flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={12} className="text-green-600" />
                <span>Ticket registered successfully.</span>
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/45 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm text-navyblack"
                >
                  <option>Technical Issue</option>
                  <option>UI Bug Report</option>
                  <option>Feature Request</option>
                </select>
              </div>
 
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Issue Details</span>
                <input
                  type="text"
                  placeholder="e.g. Dialogue log scroll layout glitch..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white/45 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm text-navyblack"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs uppercase tracking-widest rounded-xl shadow-md transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
              >
                <Send size={12} /> Submit Ticket
              </button>
            </form>

            {/* List Active Open Tickets */}
            {supportTickets.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Active Ticket Status</span>
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="flex justify-between items-center text-[10px] p-2 bg-warmpearl border border-gray-150 rounded-lg">
                      <span className="font-semibold text-primary truncate max-w-[150px]">{ticket.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        ticket.status === 'Open' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpSupportScreen;
