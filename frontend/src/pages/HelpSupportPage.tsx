import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  Search,
  BookOpen,
  Video,
  HelpCircle,
  Award,
  Mail,
  MessageSquare,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'General' | 'Simulation' | 'Practice' | 'Scenarios';
}

const FAQS: FAQItem[] = [
  {
    category: 'Simulation',
    question: 'How do autonomous AI agents negotiate with each other?',
    answer: 'In Simulation Mode, autonomous agents are assigned distinct stakeholder personas (Aggressive, Collaborative, or Risk-Averse). Each agent evaluates the ongoing dialogue, verifies its scenario-defined limits, and calculates strategic counterproposals without human intervention.',
  },
  {
    category: 'Practice',
    question: 'What is the role of the Practice Assistant in Human vs AI Mode?',
    answer: 'The Practice Assistant analyzes your live responses and offers tactical suggestions on anchoring, concession pacing, and active listening. It helps you recognize when you are giving away too much value or when non-monetary trade-offs can be leveraged.',
  },
  {
    category: 'Scenarios',
    question: 'Why are goals and constraints read-only during configuration?',
    answer: 'The three predefined scenarios (Vendor Pricing, Job Offer, and Project Budget Allocation) maintain fixed enterprise benchmark boundaries. You choose the behavioral persona while the scenario limits enforce realistic business guardrails.',
  },
  {
    category: 'General',
    question: 'How is a deadlock detected and resolved in the arena?',
    answer: 'When agents repeat positions without concession velocity, the platform detects an impasse. You can apply resolution protocols such as Reframing, Injecting Information, or Strategy Adjustments to realign utility curves.',
  },
];

export function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Technical Issue');
  const [ticketMessage, setTicketMessage] = useState('');

  const filteredFAQs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketModalOpen(false);
      setTicketSubject('');
      setTicketMessage('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Help & Support Center"
        description="Explore platform documentation, negotiation best practices, frequently asked questions, and developer support channels."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Help & Support' },
        ]}
      />

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guides, negotiation strategies, FAQ questions, or error solutions..."
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 4 Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 hover:border-blue-300 transition-all hover:shadow-xs cursor-pointer">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">User Guide</h4>
            <p className="text-xs text-slate-500">
              Complete walkthrough of simulation and practice features.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-indigo-300 transition-all hover:shadow-xs cursor-pointer">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Video className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Video Tutorials</h4>
            <p className="text-xs text-slate-500">
              Short videos demonstrating multi-party deadlock resolution.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-violet-300 transition-all hover:shadow-xs cursor-pointer">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">FAQs</h4>
            <p className="text-xs text-slate-500">
              Answers to common configuration and evaluation questions.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-emerald-300 transition-all hover:shadow-xs cursor-pointer">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Best Practices</h4>
            <p className="text-xs text-slate-500">
              Proven tactics for concessions, anchoring, and win-win trades.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Accordion */}
      <Card className="border-slate-200">
        <CardHeader className="py-4 px-6 border-b border-slate-100">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 divide-y divide-slate-100">
          {filteredFAQs.map((faq, idx) => {
            const isOpen = openFAQIndex === idx;

            return (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFAQIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>

                {isOpen && (
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Contact Support Options */}
      <Card className="border-slate-200">
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Contact Support & Submit Inquiry</CardTitle>
          <Button size="sm" onClick={() => setTicketModalOpen(true)}>
            Submit Support Ticket
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email Support</span>
              </div>
              <p className="text-slate-500 text-[11px]">support@negotiation-simulator.ai</p>
              <span className="text-[10px] text-slate-400 block pt-1">Response within 4 hours</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Live Chat Assistance</span>
              </div>
              <p className="text-slate-500 text-[11px]">Interactive assistant available 24/7</p>
              <span className="text-[10px] text-emerald-600 font-semibold block pt-1">Online now</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <PhoneCall className="w-4 h-4 text-violet-600" />
                <span>Request a Call</span>
              </div>
              <p className="text-slate-500 text-[11px]">Schedule consultation with an engineer</p>
              <span className="text-[10px] text-slate-400 block pt-1">Mon-Fri, 9am-6pm EST</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Modal */}
      <Modal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Submit Support Ticket"
        description="Our support team will review your inquiry and respond promptly."
        maxWidth="md"
      >
        {ticketSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Ticket Submitted Successfully</h4>
            <p className="text-xs text-slate-500">
              Reference ID: #{Math.floor(100000 + Math.random() * 900000)}. We will follow up shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Category
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option>Technical Issue</option>
                <option>Scenario Configuration</option>
                <option>Practice Mode Feedback</option>
                <option>API & Backend Integration</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of your question or issue"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Message
              </label>
              <textarea
                rows={4}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe what happened, error details, or feature question..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setTicketModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" rightIcon={<Send className="w-3.5 h-3.5" />}>
                Submit Ticket
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
