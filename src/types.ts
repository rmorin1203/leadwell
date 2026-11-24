/**
 * LeadWell domain model.
 *
 * Scenario content is authored as JSON (see src/data/scenarios/*.json) and validated
 * against these types at load time. The simulation engine never hard-codes scenario
 * logic, so adding a scenario means adding a JSON file — not changing engine code.
 */

export type CompetencyId =
  | 'activeListening'
  | 'emotionalIntelligence'
  | 'empathy'
  | 'accountability'
  | 'clarity'
  | 'coaching'
  | 'problemSolving'
  | 'conflictResolution';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** The communication approach a choice represents. Personas react differently to each. */
export type Approach =
  | 'inquiry'
  | 'empathetic'
  | 'directive'
  | 'judgmental'
  | 'avoidant'
  | 'collaborative'
  | 'repair'
  | 'rescuing';

/** Descriptive (not right/wrong) labels for how well a response served the conversation. */
export type ResponseQuality = 'effective' | 'partial' | 'limited';

export type SimulationMode = 'practice' | 'assessment';

export type RapportState = 'open' | 'receptive' | 'guarded' | 'closed';

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export interface PersonaApproachResponse {
  /** Added to the authored trust delta when the learner uses this approach. */
  trustModifier: number;
  /** How this persona tends to react — used in coaching notes and as AI prompt context. */
  tendency: string;
}

export interface Persona {
  id: string;
  name: string;
  pronouns: string;
  role: string;
  tenure: string;
  initials: string;
  archetype: string;
  archetypeLabel: string;
  summary: string;
  communicationStyle: string;
  behavioralProfile: string[];
  triggers: string[];
  motivators: string[];
  emotionalStates: Record<RapportState, string>;
  approachResponses: Partial<Record<Approach, PersonaApproachResponse>>;
  sampleDialogue: { context: string; line: string }[];
  /** Starting rapport (-3..3). */
  baselineTrust: number;
  /** Reserved for a future AI conversational engine: persona-level system instructions. */
  aiProfile: { voice: string; hiddenContext: string; boundaries: string };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export interface DialogueLine {
  speakerId: string; // persona id
  text: string;
  /** Short non-verbal cue, e.g. "leans back, arms crossed" */
  cue?: string;
}

export interface CoachingFeedback {
  didWell: string;
  improve: string;
  why: string;
  perception: string;
  alternative: string;
}

export interface DecisionOption {
  id: string;
  text: string;
  approach: Approach;
  quality: ResponseQuality;
  /** 0–3 rating for each competency this decision assesses. */
  ratings: Partial<Record<CompetencyId, number>>;
  /** Authored change in rapport, before persona modifiers. */
  trust: number;
  /** The employee(s)' immediate reaction to this specific choice. */
  reaction: DialogueLine[];
  feedback: CoachingFeedback;
  /** Next decision node id, or null when this choice ends the conversation. */
  next: string | null;
  /** Required when next is null. */
  outcome?: string;
}

export interface DecisionNode {
  id: string;
  /** Narration of what happens between the previous reaction and this decision. */
  narration?: string;
  /** Optional additional dialogue that sets up the decision. */
  dialogue?: DialogueLine[];
  /** The decision the learner faces, phrased as a question. */
  prompt: string;
  /** Short label used in analytics and branch maps. */
  label: string;
  options: DecisionOption[];
}

export interface ScenarioOutcome {
  id: string;
  tier: 'breakthrough' | 'productive' | 'partial' | 'strained';
  title: string;
  narrative: string;
  employeePerspective: string;
  lookingAhead: string;
}

export interface LearningObjective {
  id: string;
  text: string;
  competency: CompetencyId;
}

export interface ScenarioMeta {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  competencies: CompetencyId[];
  objectives: LearningObjective[];
  status: 'available' | 'upcoming';
  personaIds: string[];
  tags: string[];
}

export interface Scenario extends ScenarioMeta {
  status: 'available';
  context: {
    setting: string;
    situation: string;
    background: string[];
    managerObjective: string;
    whatYouKnow: string[];
  };
  startNodeId: string;
  nodes: Record<string, DecisionNode>;
  outcomes: Record<string, ScenarioOutcome>;
  /** Maps competency to the scenario-specific principle surfaced in results. */
  keyPrinciples: string[];
}

// ---------------------------------------------------------------------------
// Learner records
// ---------------------------------------------------------------------------

export interface DecisionRecord {
  nodeId: string;
  optionId: string;
  trustAfter: number;
  /** Number of times the learner rewound and retried this decision (practice only). */
  retries: number;
}

export interface SimulationAttempt {
  id: string;
  userId: string;
  scenarioId: string;
  mode: SimulationMode;
  startedAt: string;
  completedAt?: string;
  decisions: DecisionRecord[];
  outcomeId?: string;
  overallScore?: number;
  competencyScores?: Partial<Record<CompetencyId, number>>;
  finalTrust?: number;
}

export interface Reflection {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  scenarioId?: string;
  attemptId?: string;
  prompt: string;
  text: string;
  /** Behavior the learner commits to applying at work. */
  commitment?: string;
}

export interface LearnerProfile {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

export type UserRole = 'learner' | 'admin';

// ---------------------------------------------------------------------------
// Course: lessons and module progress
// ---------------------------------------------------------------------------

export interface SortActivity {
  type: 'sort';
  instructions: string;
  bins: { id: string; label: string }[];
  items: { id: string; text: string; bin: string; explanation: string }[];
}

export interface BuildActivity {
  type: 'build';
  instructions: string;
  rounds: {
    id: string;
    vague: string;
    context: string;
    parts: { part: 'situation' | 'behavior' | 'impact'; options: { id: string; text: string; correct: boolean; feedback: string }[] }[];
  }[];
}

export interface MatchActivity {
  type: 'match';
  instructions: string;
  items: { id: string; speaker: string; position: string; options: { id: string; text: string; correct: boolean }[]; explanation: string }[];
}

export type LessonActivity = SortActivity | BuildActivity | MatchActivity;

export interface Lesson {
  moduleId: string;
  title: string;
  estimatedMinutes: number;
  concept: { intro: string; model: { name: string; steps: { label: string; text: string }[] } };
  activity: LessonActivity;
  takeaway: string;
}

export interface LessonResult {
  moduleId: string;
  completedAt: string;
  /** Answers correct on the first try. */
  correct: number;
  total: number;
}
