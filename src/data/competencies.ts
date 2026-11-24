import type { CompetencyId } from '../types';

export interface CompetencyDefinition {
  id: CompetencyId;
  label: string;
  short: string;
  description: string;
  /** Behavioral indicators used in coaching and the development summary. */
  indicators: string[];
  /** A short spaced-reinforcement prompt. */
  refresher: { principle: string; tryThis: string };
  resources: { title: string; source: string; type: 'Book' | 'Framework' | 'Practice'; why: string }[];
}

export const COMPETENCIES: Record<CompetencyId, CompetencyDefinition> = {
  activeListening: {
    id: 'activeListening',
    label: 'Active Listening',
    short: 'Listening',
    description: 'Seeking to understand before responding: open questions, silence, paraphrasing, and noticing what is not said.',
    indicators: ['Asks open questions', 'Allows silence', 'Paraphrases before responding', 'Notices nonverbal cues'],
    refresher: {
      principle: 'The most useful information often arrives after a pause.',
      tryThis: 'In your next 1:1, after asking an open question, silently count to five before you speak again.',
    },
    resources: [
      { title: 'The Coaching Habit', source: 'Michael Bungay Stanier', type: 'Book', why: 'Seven practical questions, including "And what else?", that build a listening-first habit.' },
      { title: 'Paraphrase–Check loop', source: 'LeadWell practice', type: 'Practice', why: 'Summarize what you heard and ask "Did I get that right?" before responding.' },
    ],
  },
  emotionalIntelligence: {
    id: 'emotionalIntelligence',
    label: 'Emotional Intelligence',
    short: 'EQ',
    description: 'Recognizing and regulating your own emotional state, and reading and responding to others’ emotions skillfully.',
    indicators: ['Notices shifts in tone or body language', 'Adjusts approach in the moment', 'Repairs missteps', 'Stays regulated under pressure'],
    refresher: {
      principle: 'Name what you notice — without judging it.',
      tryThis: 'When a conversation tenses, try: "I notice this feels harder to talk about. Should we slow down?"',
    },
    resources: [
      { title: 'Crucial Conversations', source: 'Patterson, Grenny, McMillan & Switzler', type: 'Book', why: 'Tools for noticing when safety is at risk and restoring it.' },
      { title: 'Emotional Intelligence 2.0', source: 'Bradberry & Greaves', type: 'Book', why: 'A practical model for self- and social awareness.' },
    ],
  },
  empathy: {
    id: 'empathy',
    label: 'Empathy',
    short: 'Empathy',
    description: 'Understanding another person’s perspective and feelings, and communicating that understanding.',
    indicators: ['Acknowledges feelings explicitly', 'Avoids minimizing', 'Respects boundaries', 'Separates the person from the problem'],
    refresher: {
      principle: 'Acknowledging a feeling is not agreeing with a position.',
      tryThis: 'Practice one sentence that starts with "It sounds like…" in your next difficult exchange.',
    },
    resources: [
      { title: 'Difficult Conversations', source: 'Stone, Patton & Heen', type: 'Book', why: 'Explains the "feelings conversation" beneath every hard conversation.' },
      { title: 'Nonviolent Communication', source: 'Marshall B. Rosenberg', type: 'Book', why: 'A structure for expressing and hearing feelings and needs.' },
    ],
  },
  accountability: {
    id: 'accountability',
    label: 'Accountability',
    short: 'Accountability',
    description: 'Holding clear, fair expectations — and modeling ownership of your own part.',
    indicators: ['States expectations specifically', 'Follows up on commitments', 'Owns their own missteps', 'Does not retreat under pushback'],
    refresher: {
      principle: 'Support and accountability are partners, not opposites.',
      tryThis: 'End your next problem-solving conversation with: "So, what will you do, by when — and how will I know?"',
    },
    resources: [
      { title: 'Radical Candor', source: 'Kim Scott', type: 'Book', why: 'Shows how to care personally while challenging directly.' },
      { title: 'Expectation–Support–Follow-up', source: 'LeadWell practice', type: 'Framework', why: 'A three-step close for any performance conversation.' },
    ],
  },
  clarity: {
    id: 'clarity',
    label: 'Clarity of Communication',
    short: 'Clarity',
    description: 'Communicating specific, observable, and actionable messages without diluting the point.',
    indicators: ['Uses observable facts, not labels', 'States the core message early', 'Avoids the feedback sandwich', 'Checks understanding'],
    refresher: {
      principle: 'Specific beats general. Behavior beats character.',
      tryThis: 'Rewrite one piece of feedback using Situation–Behavior–Impact before you deliver it.',
    },
    resources: [
      { title: 'Situation–Behavior–Impact (SBI)', source: 'Center for Creative Leadership', type: 'Framework', why: 'A simple structure for clear, observable feedback.' },
      { title: 'Thanks for the Feedback', source: 'Stone & Heen', type: 'Book', why: 'Understanding how feedback is received helps you deliver it more clearly.' },
    ],
  },
  coaching: {
    id: 'coaching',
    label: 'Coaching',
    short: 'Coaching',
    description: 'Helping others discover insights and own solutions through questions rather than instructions.',
    indicators: ['Asks before telling', 'Lets the employee generate options', 'Builds commitment, not compliance', 'Offers support for the plan'],
    refresher: {
      principle: 'People commit to plans they help create.',
      tryThis: 'Before offering a solution, ask: "What options do you see?"',
    },
    resources: [
      { title: 'GROW Model', source: 'Sir John Whitmore, Coaching for Performance', type: 'Framework', why: 'Goal, Reality, Options, Will — a structure for coaching conversations.' },
      { title: 'The Coaching Habit', source: 'Michael Bungay Stanier', type: 'Book', why: 'Practical techniques to stay curious a little longer.' },
    ],
  },
  problemSolving: {
    id: 'problemSolving',
    label: 'Problem-Solving',
    short: 'Problem-Solving',
    description: 'Diagnosing root causes and co-creating practical, owned solutions — at the right point in the conversation.',
    indicators: ['Diagnoses before solving', 'Addresses root causes', 'Creates specific next steps', 'Sets a follow-up'],
    refresher: {
      principle: 'Diagnose before you prescribe.',
      tryThis: 'Ask "What do you think is really driving this?" before proposing any fix.',
    },
    resources: [
      { title: 'Five Whys', source: 'Lean / Toyota Production System', type: 'Framework', why: 'A quick technique for moving from symptoms to root causes.' },
      { title: 'Next-step contracting', source: 'LeadWell practice', type: 'Practice', why: 'Close every conversation with a named owner, action, and date.' },
    ],
  },
  conflictResolution: {
    id: 'conflictResolution',
    label: 'Conflict Resolution',
    short: 'Conflict',
    description: 'Facilitating disagreement impartially, moving parties from positions to interests, and restoring working relationships.',
    indicators: ['Sets ground rules', 'Remains impartial', 'Surfaces underlying interests', 'De-escalates rising emotion'],
    refresher: {
      principle: 'Positions are what people say they want. Interests are why.',
      tryThis: 'In your next disagreement, ask each person: "What do you need to make this work?"',
    },
    resources: [
      { title: 'Getting to Yes', source: 'Fisher, Ury & Patton', type: 'Book', why: 'The classic guide to interest-based negotiation.' },
      { title: 'Thomas–Kilmann Conflict Modes', source: 'Thomas & Kilmann', type: 'Framework', why: 'Helps you choose a deliberate approach to conflict.' },
    ],
  },
};

export const COMPETENCY_ORDER: CompetencyId[] = [
  'activeListening',
  'emotionalIntelligence',
  'empathy',
  'accountability',
  'clarity',
  'coaching',
  'problemSolving',
  'conflictResolution',
];

/** Proficiency bands — always shown as text alongside color. */
export function proficiency(score: number): { label: string; tone: 'strong' | 'solid' | 'developing' | 'emerging' } {
  if (score >= 85) return { label: 'Advanced', tone: 'strong' };
  if (score >= 70) return { label: 'Proficient', tone: 'solid' };
  if (score >= 50) return { label: 'Developing', tone: 'developing' };
  return { label: 'Emerging', tone: 'emerging' };
}
