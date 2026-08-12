import { OutcomeReport, AccountAnalytics } from '../types/report';
import { MOCK_OUTCOME_REPORTS, MOCK_ACCOUNT_ANALYTICS } from '../data/mockReports';
import { mockFetch } from './apiAdapter';

export const reportService = {
  async getOutcomeReport(sessionId: string): Promise<OutcomeReport> {
    const report = MOCK_OUTCOME_REPORTS[sessionId] || MOCK_OUTCOME_REPORTS['sim-10492'];
    return mockFetch<OutcomeReport>({
      ...report,
      sessionId,
    }, 250);
  },

  async getAccountAnalytics(_filters?: { dateRange?: string; scenarioId?: string; mode?: string }): Promise<AccountAnalytics> {
    return mockFetch<AccountAnalytics>(MOCK_ACCOUNT_ANALYTICS, 250);
  },

  async downloadPDF(sessionId: string): Promise<boolean> {
    // Simulated PDF export download
    return new Promise((resolve) => {
      setTimeout(() => {
        const dummyContent = `Multi-Agent Negotiation Simulator\nSession Outcome Report\nSession ID: ${sessionId}\nGenerated: ${new Date().toISOString()}`;
        const blob = new Blob([dummyContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Negotiation_Report_${sessionId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        resolve(true);
      }, 500);
    });
  },

  async downloadCSV(sessionId: string): Promise<boolean> {
    // Simulated CSV export download
    return new Promise((resolve) => {
      setTimeout(() => {
        const dummyContent = `Round,Agent,Offer,Decision Summary\n1,Vendor Agent,$50000,Initial counter\n2,Buyer Agent,$43000,Concession with SLA\n3,Vendor Agent,$46000,Final convergence`;
        const blob = new Blob([dummyContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Negotiation_Timeline_${sessionId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        resolve(true);
      }, 400);
    });
  }
};
