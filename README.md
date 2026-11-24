# LeadWell: The Difficult Conversations Lab

A branching leadership conversation simulator. Learners talk with realistic, fictional employees, see how each choice changes the employee's response and the rapport between them, get coaching after every decision, and finish with a competency-based results report and a reflection activity.

> All people, organizations, scenarios, learners, and results in this demonstration are fictional.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine + content validation tests
npm run build      # production build in dist/
```

The build is a static site with hash routing and relative asset paths, so `dist/` can be deployed as-is to Netlify, Vercel, GitHub Pages, S3, or any static host.

### Sandboxed single-file build (Claude artifact)

```bash
npm run build:artifact && python3 scripts/make-artifact.py   # → dist-artifact/leadwell.html
```

This variant (`VITE_TARGET=artifact`) inlines all CSS and JS into one page, keeps routes in memory instead of the URL hash, hides Print buttons, and turns file downloads (development summary, scenario JSON) into copy-to-clipboard.

## What's included

LeadWell is presented as a self-paced interactive course. Each available scenario is a module with four steps: **Lesson → Practice → Assessment → Reflection**. All steps are open, each is tracked with a checkmark, and a module is complete when all four are done. Learners can take modules in any order.

| Area | Route | Notes |
|---|---|---|
| Dashboard (course home) | `/` | Course title, learning outcomes, how modules work, syllabus with step progress, competency overview, weekly practice tip, recent activity, continue button, reset progress |
| Scenario Library | `/library` | Searchable, filterable module list; 3 modules available, 3 coming soon |
| Module | `/modules/:id` | The four steps with status, situation, manager objective, learning objectives |
| Lesson | `/modules/:id/lesson` | Key model plus an interactive activity: sort statements (Module 1), build SBI feedback from parts (Module 2), match positions to interests (Module 3) |
| Practice / Assessment | `/simulate/:id?mode=` | Branching conversation; practice has coaching and rewinds, assessment holds feedback until the end |
| Results | `/results/:attemptId` | Outcome, scores, competency breakdown, decision review, resources, next step in the module |
| Reflection | `/modules/:id/reflect` | Workplace commitment saved to the journal |
| Reflection Journal | `/journal` | Private entries: create, edit, delete |
| Course summary | `/course-summary` | Unlocks when all modules are complete: module results, competencies, commitments |

## Instructional design

- **Practice vs. formative vs. summative.** Practice mode gives coaching after every decision and lets the learner rewind. Assessment mode holds all feedback until the end and records a score. The competency profile uses assessment evidence and labels practice-only scores as estimates.
- **Nuanced options.** Each decision point offers an *effective*, a *partially effective*, and a *missed-opportunity* response. Partial options are reasonable instincts, such as directness without curiosity or empathy without accountability.
- **Five-part coaching** for every option: what you did well, what to improve, why it matters, how the employee likely heard it, and a more effective alternative.
- **Transfer.** Each simulation ends with a commitment to one observable behavior. Commitments are saved to the journal and included in the development summary.
- **Spaced reinforcement.** The dashboard shows a weekly refresher for the weakest competency and flags scenarios for review 7 days after completion.

### Scoring

Each option rates 0–3 on the competencies that decision assesses. A competency score is the points earned divided by the points available, across every decision that assessed it. The overall score is the average of the decision scores. The proficiency bands are Advanced (85+), Proficient (70+), Developing (50+), and Emerging (below 50), and the band is always shown as text. Rapport is tracked separately: `trust = authored delta + persona.approachResponses[approach].trustModifier`. That means the same approach can help with one employee and hurt with another.

## Architecture

```
src/
  types.ts                     domain model (Scenario, DecisionNode, Persona, Attempt, Reflection…)
  data/
    scenarios/*.json           JSON-driven scenario content
    personas.json              employee personality profiles (+ aiProfile for future AI use)
    competencies.ts            definitions, indicators, refreshers, resources
    lessons.json               lesson concepts and interactive activities per module
    sampleHistory.ts           optional fictional learner history
  engine/
    simulation.ts              pure branching state machine (choose, rewind, rapport)
    scoring.ts                 path scoring + competency profile
    responseEngine.ts          ResponseEngine interface; ScriptedResponseEngine today
    validation.ts              graph + content validator (used by tests)
    course.ts                  module steps, course progress, next step
    recommend.ts               recommendations, spaced review, session autosave
  services/
    repository.ts              LearnerRepository interface + LocalDemoRepository
    supabaseRepository.ts      Supabase implementation of the same interface
  state/AppContext.tsx         app state, persistence, toasts
  pages/, components/          UI
supabase/schema.sql            tables, views, and Row Level Security policies
```

### Adding a scenario

1. Copy an existing file in `src/data/scenarios/`, and add a matching lesson to `src/data/lessons.json`.
2. Write the nodes, options (with `ratings`, `trust`, `reaction`, and `feedback`), and outcomes. Terminal options set `"next": null` and an `"outcome"`.
3. Register the file in `src/data/index.ts`.
4. Run `npm test`. The validator checks for broken links, cycles, unreachable nodes, paths with fewer than 3 decisions, missing feedback fields, and invalid ratings.

### Adding AI conversation later

The simulator gets employee replies from `responseEngine.respond(ctx)`. To use an AI model, write an `AIResponseEngine` that implements `ResponseEngine`. It can use `buildAIPersonaPrompt()`, which already includes each persona's voice, hidden context, and boundaries. Scoring, feedback, persistence, and the UI do not change.

### Supabase

Demo mode needs no backend and stores progress in the browser's `localStorage`. To use Supabase:

1. Run `supabase/schema.sql` in your project.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. After sign-in, pass `new SupabaseRepository(getSupabaseClient()!, user.id)` to `<AppProvider repository={…}>`.

The Row Level Security policies limit each learner to their own attempts and reflections. Administrators can read attempts and scores, but no policy gives them access to reflection text. They only get the `admin_reflection_counts` view.

## Accessibility

The app aims for WCAG 2.2 AA:

- skip link, landmarks, and a logical heading order
- visible focus rings and full keyboard operation
- labeled form fields with inline, announced error messages
- `aria-live` announcements for employee replies and confirmations
- text descriptions for charts
- touch targets of at least 44 px
- support for `prefers-reduced-motion`
- quality and proficiency always shown with text or icons, never color alone
