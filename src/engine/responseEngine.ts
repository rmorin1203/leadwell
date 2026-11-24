import type { DecisionOption, DialogueLine, Persona, Scenario } from '../types';
import { rapportState } from './simulation';

/**
 * Response engine seam.
 *
 * The simulator asks a ResponseEngine for the employee's reaction to each choice.
 * Today the ScriptedResponseEngine returns pre-authored lines from the scenario JSON.
 * A future AIResponseEngine can implement the same interface — using persona.aiProfile,
 * the scenario context, the conversation so far, and the current rapport — without any
 * change to the simulator UI, scoring, or persistence.
 */
export interface ResponseContext {
  scenario: Scenario;
  personas: Persona[];
  option: DecisionOption;
  trust: Record<string, number>;
  transcript: DialogueLine[];
}

export interface EmployeeTurn {
  lines: DialogueLine[];
  /** Persona id → short description of current emotional state. */
  moods: Record<string, string>;
}

export interface ResponseEngine {
  readonly kind: 'scripted' | 'ai';
  respond(ctx: ResponseContext): Promise<EmployeeTurn>;
}

export class ScriptedResponseEngine implements ResponseEngine {
  readonly kind = 'scripted' as const;

  async respond({ option, personas, trust }: ResponseContext): Promise<EmployeeTurn> {
    const moods: Record<string, string> = {};
    for (const p of personas) {
      moods[p.id] = p.emotionalStates[rapportState(trust[p.id] ?? 0)];
    }
    return { lines: option.reaction, moods };
  }
}

/** Builds the prompt an AI engine would use — kept here to document the integration contract. */
export function buildAIPersonaPrompt(persona: Persona, scenario: Scenario, trust: number): string {
  return [
    `You are ${persona.name}, ${persona.role}. ${persona.summary}`,
    `Communication style: ${persona.communicationStyle}`,
    `Voice: ${persona.aiProfile.voice}`,
    `Private context (reveal only if trust is high): ${persona.aiProfile.hiddenContext}`,
    `Boundaries: ${persona.aiProfile.boundaries}`,
    `Situation: ${scenario.context.situation}`,
    `Current emotional state: ${persona.emotionalStates[rapportState(trust)]}`,
    'Reply in one to three sentences, in character, as spoken dialogue.',
  ].join('\n');
}

export const responseEngine: ResponseEngine = new ScriptedResponseEngine();
