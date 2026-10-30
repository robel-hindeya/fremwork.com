/** Copy for the homepage, taken verbatim from the design. [BRACKETED] values are placeholders to fill in. */

export interface ChatLine { k: string; v: string }
export interface ChatMsg { you?: string; agent?: string; lines?: ChatLine[]; plain?: boolean }
export interface Assistant {
  name: string; role: string; color: string; preview: string; topics: string; helpIntro: string;
  skills: ChatLine[]; suggest: string[]; answers: { k: string; text: string; lines: ChatLine[] }[];
}
export type ProductId = 'chat' | 'assistants' | 'insights' | 'close' | 'payables';
export interface Product { id: ProductId; name: string; desc: string; color: string; chat: ({ you: string } | { agent: string })[] }

export const CHATS: Assistant[] = [
  { name: 'Analyst', role: 'FP&A', color: '#C6F432', preview: 'Margin, revenue and trends.', topics: 'margin, revenue and trends',
    helpIntro: 'I am your Analyst. I turn your numbers into plain answers. Here is how I can help:',
    skills: [{ k: 'Explain changes', v: 'why margin, revenue or spend moved' }, { k: 'Compare periods', v: 'month on month, year on year' }, { k: 'Spot trends', v: 'what is growing and what is slipping' }, { k: 'Recommend', v: 'a clear next step with every answer' }],
    suggest: ['How can you help me?', 'Why did margin drop in October?', 'Which product line grew fastest?'],
    answers: [
      { k: 'margin', text: 'Gross margin fell to [YOUR METRIC] in October, down [YOUR METRIC] on September.', lines: [{ k: 'Main cause', v: 'supplier costs up on [YOUR CATEGORY]' }, { k: 'Also', v: 'more discounting in the last week' }, { k: 'Recommendation', v: 'review supplier pricing before the next order' }] },
      { k: 'grew|growth|fastest|product line', text: '[PRODUCT LINE] grew fastest this quarter.', lines: [{ k: 'Growth', v: '[YOUR METRIC] on last quarter' }, { k: 'Driver', v: 'repeat customers' }, { k: 'Recommendation', v: 'put more of next month’s budget behind it' }] },
      { k: 'revenue|sales', text: 'Revenue for October was [YOUR METRIC].', lines: [{ k: 'vs September', v: '[YOUR METRIC]' }, { k: 'Biggest customer', v: '[CUSTOMER]' }, { k: 'Recommendation', v: 'follow up on the two late renewals' }] }
    ] },
  { name: 'Accountant', role: 'BOOKKEEPING', color: '#8FA2FF', preview: 'Books, receipts and reconciliations.', topics: 'your books, receipts and reconciliations',
    helpIntro: 'I am your Accountant. I keep the books clean so the answers are right. Here is how I can help:',
    skills: [{ k: 'Reconcile', v: 'match bank feeds to your books' }, { k: 'Categorise', v: 'sort every transaction' }, { k: 'Chase receipts', v: 'ask card holders for what is missing' }, { k: 'Get ready', v: 'tidy books for tax and your accountant' }],
    suggest: ['How can you help me?', 'Close out October for me.', 'Which receipts are missing?'],
    answers: [
      { k: 'receipt', text: 'Two receipts are missing for October:', lines: [{ k: '[CARD HOLDER]', v: '[SUPPLIER] · [YOUR METRIC]' }, { k: '[CARD HOLDER]', v: '[SUPPLIER] · [YOUR METRIC]' }, { k: 'Next step', v: 'I have sent both of them a reminder' }] },
      { k: 'close|october|reconcil|books', text: 'Done. Here is where the books stand:', lines: [{ k: 'Reconciled', v: 'all bank feeds for October' }, { k: 'Categorised', v: '[YOUR METRIC] transactions' }, { k: 'Missing', v: '2 receipts, requests sent' }] }
    ] },
  { name: 'Finance Manager', role: 'BUDGETS', color: '#1FA971', preview: 'Budgets and team spend.', topics: 'budgets and team spend',
    helpIntro: 'I am your Finance Manager. I keep every team on plan. Here is how I can help:',
    skills: [{ k: 'Budget vs actual', v: 'for every team, every month' }, { k: 'Team spend', v: 'who spent what, and on what' }, { k: 'Forecast', v: 'where the year will land' }, { k: 'Alerts', v: 'a heads-up before a team goes over' }],
    suggest: ['How can you help me?', 'Which teams are over budget?', 'Send Q3 budget vs actual.'],
    answers: [
      { k: 'over|overspend', text: 'One team is over budget this quarter:', lines: [{ k: 'Marketing', v: 'over by [YOUR METRIC]' }, { k: 'On plan', v: 'Sales, Operations, Product' }, { k: 'Recommendation', v: 'review Marketing spend with its lead on Friday' }] },
      { k: 'budget|q3|send', text: 'Sent to each team lead. Summary:', lines: [{ k: 'On plan', v: 'Sales, Operations' }, { k: 'Over plan', v: 'Marketing, by [YOUR METRIC]' }, { k: 'Under plan', v: 'Product, by [YOUR METRIC]' }] }
    ] },
  { name: 'Controller', role: 'MONTH-END', color: '#EDEDED', preview: 'Month-end close and checks.', topics: 'month-end close and checks',
    helpIntro: 'I am your Controller. I run month-end so nothing slips. Here is how I can help:',
    skills: [{ k: 'Close checklist', v: 'every step, tracked' }, { k: 'Journals', v: 'accruals, depreciation and payroll' }, { k: 'Intercompany', v: 'match balances between entities' }, { k: 'Audit trail', v: 'who changed what, and when' }],
    suggest: ['How can you help me?', 'Where are we on month-end close?', 'What is still open?'],
    answers: [
      { k: 'open|left|remaining', text: 'Two items are still open:', lines: [{ k: 'Intercompany match', v: 'waiting on [ENTITY]' }, { k: 'Deferred revenue', v: 'review due Thursday' }, { k: 'Next step', v: 'I will remind both owners tomorrow' }] },
      { k: 'close|month-end|month end', text: 'Almost there:', lines: [{ k: 'Done', v: 'accruals, depreciation, payroll journal' }, { k: 'Open', v: 'intercompany match, deferred revenue' }, { k: 'Close date', v: 'on track for [YOUR DATE]' }] }
    ] },
  { name: 'Payables', role: 'AP', color: '#F5A524', preview: 'Bills, due dates and approvals.', topics: 'bills, due dates and approvals',
    helpIntro: 'I am Payables. I make sure the right bills get paid on time. Here is how I can help:',
    skills: [{ k: 'Bills due', v: 'everything you owe, by date' }, { k: 'Overdue', v: 'flagged first' }, { k: 'Approvals', v: 'nothing is paid until you approve' }, { k: 'Duplicates', v: 'catch invoices billed twice' }],
    suggest: ['How can you help me?', 'What do we owe this week?', 'Is anything overdue?'],
    answers: [
      { k: 'overdue|late', text: 'Yes, one bill is overdue:', lines: [{ k: '[SUPPLIER]', v: '[YOUR METRIC], two days late' }, { k: 'Recommendation', v: 'pay today to avoid a late fee' }] },
      { k: 'owe|due|week|bill', text: 'Three bills are due this week:', lines: [{ k: 'Overdue', v: '[SUPPLIER] · [YOUR METRIC]' }, { k: 'Due Thu', v: '[SUPPLIER] · [YOUR METRIC]' }, { k: 'Due Fri', v: '[SUPPLIER] · [YOUR METRIC]' }] }
    ] },
  { name: 'Treasury', role: 'CASH', color: '#E5484D', preview: 'Cash, runway and accounts.', topics: 'cash, runway and accounts',
    helpIntro: 'I am Treasury. I watch your cash so you always know where you stand. Here is how I can help:',
    skills: [{ k: 'Cash position', v: 'across every account, today' }, { k: 'Runway', v: 'how many months you have' }, { k: 'Forecast', v: 'cash in and out, week by week' }, { k: 'Idle cash', v: 'money that could work harder' }],
    suggest: ['How can you help me?', 'How much runway do we have?', 'Where is our cash sitting?'],
    answers: [
      { k: 'runway|months|burn', text: 'At current burn you have [YOUR METRIC] months of runway.', lines: [{ k: 'Cash', v: '[YOUR METRIC] across all accounts' }, { k: 'Monthly burn', v: '[YOUR METRIC]' }, { k: 'Recommendation', v: 'move idle cash to the savings account' }] },
      { k: 'cash|sitting|where|account', text: 'Here is where your cash is today:', lines: [{ k: 'Operating account', v: '[YOUR METRIC]' }, { k: 'Savings', v: '[YOUR METRIC]' }, { k: 'Card balances', v: '[YOUR METRIC] owed' }] }
    ] }
];

export const PRODUCTS: Product[] = [
  { id: 'chat', name: 'Chat', desc: 'Ask any finance question in plain language and get a clear answer.', color: '#C6F432', chat: [
    { you: 'How much cash do we have right now?' },
    { agent: 'Cash across all accounts is [YOUR METRIC] as of today. That covers [YOUR METRIC] months at current spend.' },
    { you: 'What changed since last month?' },
    { agent: 'Two customer payments landed early and payroll ran on the 28th. Net change: + [YOUR METRIC].' } ] },
  { id: 'assistants', name: 'Assistants', desc: 'A whole finance team in one chat: Analyst, Accountant, Controller and more.', color: '#8FA2FF', chat: [
    { you: 'Who can close October for me?' },
    { agent: 'Accountant here. I can reconcile your bank feeds and flag missing receipts.' },
    { you: 'And who checks the budget?' },
    { agent: 'That is the Finance Manager. I will send budget vs actual to each team lead.' } ] },
  { id: 'insights', name: 'Insights', desc: 'Cash, margin and spend explained, with a recommendation every time.', color: '#1FA971', chat: [
    { you: 'Why did margin drop in October?' },
    { agent: 'Supplier costs rose on [YOUR CATEGORY]. That explains most of the drop.' },
    { agent: 'Recommendation: review supplier pricing before the next order.' } ] },
  { id: 'close', name: 'Close', desc: 'Month-end checklists, reconciliations and accruals, kept on track.', color: '#EDEDED', chat: [
    { you: 'Where are we on month-end?' },
    { agent: 'Accruals and payroll journal are done. Intercompany match and deferred revenue are still open.' },
    { you: 'Remind me Friday.' },
    { agent: 'Done. I will check in Friday morning with what is left.' } ] },
  { id: 'payables', name: 'Payables', desc: 'Bills, due dates and approvals in one queue.', color: '#F5A524', chat: [
    { you: 'What do we owe this week?' },
    { agent: 'Three bills are due. One from [SUPPLIER] is overdue by two days.' },
    { you: 'Queue them for approval.' },
    { agent: 'Queued. Nothing is paid until you approve.' } ] }
];

export const POINTS: Record<ProductId, string[]> = {
  chat: ['Plain-language questions, no formulas', 'Every figure shows its source and period', 'Follow-ups keep the context'],
  assistants: ['Analyst, Accountant, Finance Manager, Controller, Payables, Treasury', 'Each one knows its job', 'Hand work between them in one thread'],
  insights: ['Explains what changed and why', 'Flags what needs attention', 'Ends on a recommendation you can act on'],
  close: ['Month-end checklist that updates itself', 'Reconciliations and accruals tracked', 'Reminders before anything slips'],
  payables: ['All bills and due dates in one queue', 'Overdue items flagged first', 'Nothing is paid until you approve']
};

export const TAGS: Record<ProductId, string> = { chat: 'ASK', assistants: 'TEAM', insights: 'UNDERSTAND', close: 'MONTH-END', payables: 'PAY' };
