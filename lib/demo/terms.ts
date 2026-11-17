/** Plain-language definitions for the synthetic public demo. */
export const DEMO_TERMS = {
  spom: {
    label: 'SPOM \u2014 Salesperson of the Month',
    definition:
      'A monthly sales ranking for sales representatives, the people who sell ticket plans and group packages.'
  },
  score: {
    label: 'SPOM score',
    definition:
      'In this demo, the dollar amounts in all eight categories add up to the score. Negative amounts reverse earlier sales. This is illustrative sales credit, not pay or commission.'
  },
  paymentMonth: {
    label: 'Payment month',
    definition:
      'The month a payment is credited in this report. It can differ from the date the ticket was ordered or the game was played.'
  },
  views: {
    label: 'Manager view / representative preview',
    definition:
      'Manager view compares the whole fictional team. Representative preview shows one fictional salesperson\u2019s results.'
  },
  plans: {
    label: 'Full season / partial plan / mini plan',
    definition:
      'A full-season plan covers the season\u2019s home matches. Partial and mini plans bundle a smaller selection of matches.'
  },
  spomOther: {
    label: 'Other SPOM categories',
    definition:
      'Individual means single-match sales; groups and youth soccer are package categories. Rentals and licenses are invented non-ticket sales categories here, with no real contract rules modeled.'
  },
  netRevenue: {
    label: 'Net ticket revenue',
    definition:
      'Ticket sales value after cancellations and reversals. It measures sales, not necessarily cash already collected.'
  },
  netTickets: {
    label: 'Net / paid / complimentary tickets',
    definition:
      'Net tickets are tickets remaining after cancellations. Paid tickets have a price; complimentary (comp) tickets are free. Net tickets include both.'
  },
  attainment: {
    label: 'Goal attainment / gap',
    definition:
      'Attainment is revenue divided by the target: 80% means $80 of each $100 goal is reached. Gap is target minus revenue; a negative gap means the goal was exceeded.'
  },
  fse: {
    label: 'FSE \u2014 full-season equivalent',
    definition:
      'A way to express ticket-plan volume in units of a complete season. Smaller plans can contribute fractions of one FSE; exact counting rules vary. FSE is the plan-sales category in this demo.'
  },
  atp: {
    label: 'ATP \u2014 average ticket price',
    definition:
      'The average price per paid ticket. Complimentary tickets are excluded from the paid-ticket average.'
  },
  pacing: {
    label: 'Pacing / goal pace',
    definition:
      'Pacing shows how sales build over time. Goal pace is the target path toward the final revenue goal. Dana\u2019s chart uses invented paths, not historical performance.'
  },
  forecast: {
    label: 'Booked / demo forecast',
    definition:
      'Booked is the synthetic sales recorded so far. The forecast is an invented end result for demonstration, not a prediction from a model. Match-chart \u201c14d\u201d means 14 days before kickoff.'
  },
  genie: {
    label: 'Genie',
    definition:
      'Shield\u2019s question-and-answer data assistant. This public demo matches example questions to scripted answers calculated from fake data; it does not call an AI model or a live database.'
  },
  shield: {
    label: 'Shield',
    definition:
      'The reporting interface in this demo. A franchise is a team workspace: choose LA Galaxy for soccer or LA Kings for hockey.'
  },
  sql: {
    label: 'SQL \u2014 Structured Query Language',
    definition:
      'A language for asking a database for rows and totals. The expandable query is a scripted example; the demo calculates its answer from local fake data.'
  },
  periods: {
    label: 'PRE / REG / season to date / YoY',
    definition:
      'PRE means preseason; REG means regular season. Season to date covers the start of the selected season through the selected date. YoY means comparison with the same period a year earlier.'
  },
  payments: {
    label: 'Payment lifecycle',
    definition:
      'The current payment status of an order. Scheduled means a payment is due later; declined means a payment attempt failed; recovered means a later payment succeeded after a decline; no activity means no payment attempt is recorded.'
  },
  paidOrders: {
    label: 'Paid orders / outstanding amount',
    definition:
      'Paid orders are fully paid in this demo. Outstanding is money still owed on the currently declined orders. Order counts differ from ticket counts: one order can contain several tickets.'
  },
  attribution: {
    label: 'Attributed revenue / campaign spend',
    definition:
      'Attributed revenue is sales credited to a campaign in the fictional data. Spend is the campaign cost. Attributed revenue is not profit or proof that the campaign caused the sale.'
  },
  visits: {
    label: 'Visits / orders',
    definition:
      'Visits count website sessions, not necessarily different people. Orders count purchases, not tickets; one order may contain several tickets.'
  },
  fanGrowth: {
    label: 'Fan growth / FDG',
    definition:
      'The increase in known fan records in a team\u2019s database. It is different from social followers or game attendance; all counts here are fake.'
  },
  impressions: {
    label: 'Social impressions / engagement',
    definition:
      'Impressions count how many times content was displayed, including repeat views. Engagement measures interactions such as likes, comments and shares. The displayed rates and league ranks are illustrative.'
  },
  powerUsers: {
    label: 'App power users',
    definition:
      'The demo\u2019s label for highly active app users. It is an example engagement metric; no real activity threshold is modeled.'
  },
  sellThrough: {
    label: 'Sell through',
    definition:
      'The percentage of available ticket capacity already sold. It measures inventory, not the number of people who actually attended.'
  },
  priceLevels: {
    label: 'Price level / product mix / heat map',
    definition:
      'A price level groups seats into pricing tiers. Product mix splits sales among plans, groups and single-game tickets. The heat map compares those categories across pricing tiers.'
  },
  analysis: {
    label: 'Event code / days out',
    definition:
      'An event code is a short identifier for a game. Days out counts days before the game; sales days out filters when the purchase happened relative to game day.'
  },
  attendance: {
    label: 'Distributed tickets / scans / attendees',
    definition:
      'Distributed tickets include paid and complimentary tickets issued. Scans record ticket entry checks; attendees count people attending. Sales, tickets issued and actual attendance are different measures; all are simulated here.'
  },
  ancillary: {
    label: 'Ancillary products',
    definition:
      'Extras alongside admission tickets, such as parking, experience vouchers, passes and giveaways. They are counted separately from admission tickets.'
  }
} as const;

export type DemoTerm = keyof typeof DEMO_TERMS;

const aliases: Record<string, DemoTerm> = {
  spom: 'spom',
  'salesperson of the month': 'spom',
  score: 'score',
  'spom score': 'score',
  'payment month': 'paymentMonth',
  fse: 'fse',
  'new fse': 'fse',
  atp: 'atp',
  genie: 'genie',
  shield: 'shield',
  sql: 'sql',
  pacing: 'pacing',
  'goal pace': 'pacing',
  forecast: 'forecast',
  'demo forecast': 'forecast',
  booked: 'forecast',
  'net revenue': 'netRevenue',
  'net ticket revenue': 'netRevenue',
  'net tickets': 'netTickets',
  'comp tickets': 'netTickets',
  'complimentary tickets': 'netTickets',
  'paid tickets': 'netTickets',
  'goal attainment': 'attainment',
  gap: 'attainment',
  'payment lifecycle': 'payments',
  'recovered after decline': 'payments',
  'attributed revenue': 'attribution',
  'campaign spend': 'attribution',
  'fan growth': 'fanGrowth',
  fdg: 'fanGrowth',
  impressions: 'impressions',
  'social impressions': 'impressions',
  'engagement rate': 'impressions',
  'app power users': 'powerUsers',
  'sell through': 'sellThrough',
  'price level': 'priceLevels',
  'product mix': 'priceLevels',
  'heat map': 'priceLevels',
  'ancillary products': 'ancillary',
  'days out': 'analysis',
  'event code': 'analysis',
  scans: 'attendance',
  'distributed tickets': 'attendance',
  yoy: 'periods',
  'season to date': 'periods',
  pre: 'periods',
  reg: 'periods'
};

export function findDemoTerm(question: string): DemoTerm | undefined {
  const match = question
    .toLowerCase()
    .trim()
    .match(
      /^(?:what (?:is|are|does)|explain|define|meaning of)\s+(.+?)\s*[?.!]*$/
    );
  if (!match) return undefined;
  const name = match[1]
    .replace(/\s+(?:mean|stand for)$/, '')
    .replace(/^(?:a|an|the)\s+/, '')
    .replace(/[?.!]+$/, '')
    .trim();
  return Object.hasOwn(aliases, name) ? aliases[name] : undefined;
}
