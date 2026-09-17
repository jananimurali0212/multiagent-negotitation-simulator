/**
 * Utility for generating clean, professional, human-readable negotiation transcripts.
 */

export function generateCleanTranscript(
  reportOrSession: any,
  messagesList?: any[]
): string {
  if (!reportOrSession) return '';

  const scenarioTitle =
    reportOrSession.scenario_title ||
    (reportOrSession.scenario_id
      ? reportOrSession.scenario_id
          .split('-')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : 'Negotiation Session');

  const rawDate = reportOrSession.created_at || reportOrSession.updated_at;
  const dateTimeStr = rawDate
    ? new Date(rawDate).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  // Negotiation Mode
  let modeStr = reportOrSession.mode || 'N/A';
  if (modeStr === 'human-ai') modeStr = 'Human vs AI Practice';
  else if (modeStr === 'ai-ai') modeStr = 'AI vs AI Simulation';
  else if (modeStr === 'collaborative') modeStr = 'Collaborative Practice Mode';
  else if (modeStr === 'risk_averse') modeStr = 'Risk-Averse Practice Mode';
  else if (modeStr === 'aggressive') modeStr = 'Aggressive Practice Mode';

  // Messages resolution
  const msgs =
    messagesList && messagesList.length > 0
      ? messagesList
      : reportOrSession.messages && reportOrSession.messages.length > 0
      ? reportOrSession.messages
      : [];

  // Participants & Roles
  let participantsList: string[] = [];
  if (
    reportOrSession.participants &&
    Array.isArray(reportOrSession.participants) &&
    reportOrSession.participants.length > 0
  ) {
    participantsList = reportOrSession.participants.map(
      (p: any) =>
        `- ${p.name || p.role} (${p.role || 'Participant'})${
          p.is_human ? ' (Human)' : ' (AI)'
        }`
    );
  } else if (
    reportOrSession.agents &&
    Array.isArray(reportOrSession.agents) &&
    reportOrSession.agents.length > 0
  ) {
    participantsList = reportOrSession.agents.map(
      (a: any) => `- ${a.name} (${a.role})`
    );
  }

  if (participantsList.length === 0 && msgs.length > 0) {
    const uniqueSenders = new Map<string, { role: string; isUser: boolean }>();
    msgs.forEach((m: any) => {
      if (m.sender && !uniqueSenders.has(m.sender)) {
        uniqueSenders.set(m.sender, {
          role: m.role || 'Participant',
          isUser: !!m.is_user,
        });
      }
    });
    uniqueSenders.forEach((info, sender) => {
      let cleanSender = sender.split('(')[0].trim();
      participantsList.push(
        `- ${cleanSender} (${info.role})${info.isUser ? ' (Human)' : ' (AI)'}`
      );
    });
  }

  if (participantsList.length === 0) {
    participantsList = ['- Participant (Human)', '- Counterparty (AI)'];
  }

  // Calculate total rounds
  let maxRound = reportOrSession.rounds_completed || 1;
  if (msgs.length > 0) {
    const roundsFromMsgs = msgs.map((m: any) => m.round || 1);
    maxRound = Math.max(maxRound, ...roundsFromMsgs);
  }

  // Group messages by round in chronological order
  const roundsMap = new Map<number, any[]>();
  msgs.forEach((m: any) => {
    const r = m.round || 1;
    if (!roundsMap.has(r)) {
      roundsMap.set(r, []);
    }
    roundsMap.get(r)!.push(m);
  });

  // Format Conversation
  let conversationStr = '';
  if (roundsMap.size > 0) {
    const sortedRounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);
    const roundBlocks: string[] = [];

    sortedRounds.forEach((rNum) => {
      const rMsgs = roundsMap.get(rNum) || [];
      const msgLines = rMsgs.map((m: any) => {
        let speaker = m.sender || m.role || 'Participant';
        if (speaker.includes('(')) {
          speaker = speaker.split('(')[0].trim();
        }
        if (!m.is_user && !speaker.toLowerCase().includes('ai')) {
          speaker = `${speaker} AI`;
        }
        const messageText = m.content ? m.content.trim() : '';
        return `${speaker}: ${messageText}`;
      });

      roundBlocks.push(`**Round ${rNum}**\n${msgLines.join('\n\n')}`);
    });

    conversationStr = roundBlocks.join('\n\n');
  } else {
    conversationStr = 'No conversation history available.';
  }

  // Format Final Agreement Terms
  const terms = reportOrSession.final_terms || {};
  const initData = reportOrSession.initial_data || reportOrSession.scenario_data || {};
  const analysis = reportOrSession.scenario_analysis || {};

  const finalPrice =
    terms.price ||
    terms.salary ||
    terms.final_price ||
    terms.final_salary ||
    terms.targetPrice ||
    terms.targetSalary ||
    analysis.final_price ||
    analysis.final_salary ||
    initData.initial_vendor_price ||
    initData.initial_salary_offer ||
    'N/A';

  const quantity =
    terms.quantity ||
    initData.quantity ||
    initData.job_role ||
    'N/A';

  const paymentTerms =
    terms.payment_terms ||
    terms.paymentTerms ||
    terms.work_mode ||
    initData.payment_terms ||
    initData.work_mode ||
    'N/A';

  const delivery =
    terms.delivery ||
    terms.delivery_requirements ||
    terms.joining_date ||
    initData.delivery_requirements ||
    initData.joining_date ||
    'N/A';

  const qualityWarranty =
    terms.quality ||
    terms.quality_requirements ||
    terms.warranty ||
    terms.benefits ||
    initData.quality_requirements ||
    initData.benefits ||
    'N/A';

  const knownKeys = new Set([
    'price',
    'salary',
    'final_price',
    'final_salary',
    'targetPrice',
    'targetSalary',
    'quantity',
    'payment_terms',
    'paymentTerms',
    'work_mode',
    'delivery',
    'delivery_requirements',
    'joining_date',
    'quality',
    'quality_requirements',
    'warranty',
    'benefits',
  ]);

  const extraTerms: string[] = [];
  Object.keys(terms).forEach((k) => {
    if (!knownKeys.has(k) && terms[k]) {
      extraTerms.push(`${k}: ${terms[k]}`);
    }
  });

  let otherAgreedTerms = extraTerms.length > 0 ? extraTerms.join(', ') : '';
  if (!otherAgreedTerms) {
    otherAgreedTerms =
      initData.other_requirements ||
      initData.other_conditions ||
      'Standard Commercial Terms';
  }

  const outcomeStr =
    reportOrSession.outcome ||
    (reportOrSession.agreement_reached ? 'Agreement Reached' : 'Completed');

  return `**NEGOTIATION TRANSCRIPT**

Scenario: ${scenarioTitle}
Date & Time: ${dateTimeStr}
Participants and Roles:
${participantsList.join('\n')}
Negotiation Mode: ${modeStr}
Total Rounds: ${maxRound}

**CONVERSATION**

${conversationStr}

**FINAL AGREEMENT**

Final Price: ${finalPrice}
Quantity: ${quantity}
Payment Terms: ${paymentTerms}
Delivery: ${delivery}
Quality/Warranty: ${qualityWarranty}
Other Agreed Terms: ${otherAgreedTerms}
Outcome: ${outcomeStr}`;
}

export function downloadTranscriptFile(
  reportOrSession: any,
  messagesList?: any[]
) {
  const transcriptContent = generateCleanTranscript(reportOrSession, messagesList);
  const blob = new Blob([transcriptContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;

  const id = reportOrSession.session_id || reportOrSession.id || 'session';
  const scenario = reportOrSession.scenario_id || 'negotiation';
  downloadAnchor.download = `${scenario}-transcript-${id}.txt`;

  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}
