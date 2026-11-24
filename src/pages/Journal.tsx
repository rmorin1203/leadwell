import { BookOpen, Lock, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, PageHeader, Tag, formatDate } from '../components/ui';
import { SCENARIOS, getScenario } from '../data';
import { useApp } from '../state/AppContext';
import type { Reflection } from '../types';

const PROMPTS = [
  'What is one behavior you will apply in your next workplace conversation?',
  'Describe a real conversation this week. What would you do differently now?',
  'Which employee reaction surprised you, and why?',
  'Where do you tend to move too quickly — to solutions, to judgment, or to reassurance?',
];

export default function Journal() {
  const { reflections, deleteReflection, notify } = useApp();
  const [editing, setEditing] = useState<Reflection | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const sorted = [...reflections].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div>
      <PageHeader
        eyebrow="Reflection Journal"
        title="Your private reflection journal"
        description={
          <span className="inline-flex items-start gap-2">
            <Lock size={15} className="mt-1 shrink-0" aria-hidden /> Only you can see these entries. Reflections you write in a module also check off that module's reflection step.
          </span>
        }
        actions={!editing && <Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden /> New entry</Button>}
      />

      {editing && <EntryForm entry={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}

      {sorted.length === 0 && !editing ? (
        <EmptyState icon={BookOpen} title="No reflections yet" action={<Button onClick={() => setEditing('new')}>Write your first entry</Button>}>
          Reflection turns practice into workplace behavior. Each module ends with a reflection step, and you can add your own entries here anytime.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {sorted.map((r) => {
            const s = getScenario(r.scenarioId);
            return (
              <Card as="li" key={r.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {formatDate(r.createdAt, true)}
                      {r.updatedAt !== r.createdAt && ' (edited)'}
                    </p>
                    <h2 className="mt-1 text-base font-semibold">{r.prompt}</h2>
                  </div>
                  <div className="flex items-center gap-1">
                    {s && <Tag>{s.shortTitle}</Tag>}
                    <button onClick={() => setEditing(r)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-sand-100 hover:text-navy-900" aria-label="Edit entry">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(r.id)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-700" aria-label="Delete entry">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {r.text && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{r.text}</p>}
                {r.commitment && (
                  <p className="mt-3 flex gap-2 rounded-xl bg-teal-50 p-3 text-sm text-navy-900">
                    <Target size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden />
                    <span><span className="font-semibold">Commitment: </span>{r.commitment}</span>
                  </p>
                )}
                {r.attemptId && (
                  <Link to={`/results/${r.attemptId}`} className="mt-3 inline-block text-xs font-semibold text-teal-700 hover:underline">View related results</Link>
                )}
                {confirmDelete === r.id && (
                  <div role="alertdialog" aria-labelledby={`del-${r.id}`} className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-4">
                    <p id={`del-${r.id}`} className="text-sm font-semibold text-rose-700">Delete this entry permanently?</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="danger" onClick={() => { deleteReflection(r.id); setConfirmDelete(null); notify('Journal entry deleted.'); }}>Delete</Button>
                      <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EntryForm({ entry, onDone }: { entry?: Reflection; onDone: () => void }) {
  const { saveReflection, notify } = useApp();
  const [prompt, setPrompt] = useState(entry?.prompt ?? PROMPTS[1]);
  const [text, setText] = useState(entry?.text ?? '');
  const [commitment, setCommitment] = useState(entry?.commitment ?? '');
  const [scenarioId, setScenarioId] = useState(entry?.scenarioId ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 5 && commitment.trim().length < 5) {
      setError('Write a reflection or a commitment before saving.');
      document.getElementById('j-text')?.focus();
      return;
    }
    saveReflection({ id: entry?.id, prompt, text: text.trim(), commitment: commitment.trim() || undefined, scenarioId: scenarioId || undefined, attemptId: entry?.attemptId });
    notify(entry ? 'Journal entry updated.' : 'Journal entry saved.');
    onDone();
  };

  return (
    <Card as="section" className="mb-6 border-teal-200 p-6" aria-labelledby="entry-form">
      <h2 id="entry-form" className="mb-4 text-lg font-bold">{entry ? 'Edit entry' : 'New journal entry'}</h2>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="j-prompt" className="label">Reflection prompt</label>
            <select id="j-prompt" className="input" value={prompt} onChange={(e) => setPrompt(e.target.value)}>
              {[...new Set([prompt, ...PROMPTS])].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="j-scenario" className="label">Related module <span className="font-normal text-slate-500">(optional)</span></label>
            <select id="j-scenario" className="input" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              <option value="">None: a real workplace conversation</option>
              {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="j-text" className="label">Your reflection</label>
          <textarea id="j-text" rows={4} className="input" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'j-err' : undefined} />
        </div>
        <div>
          <label htmlFor="j-commit" className="label">Commitment <span className="font-normal text-slate-500">(optional)</span></label>
          <input id="j-commit" className="input" value={commitment} onChange={(e) => setCommitment(e.target.value)} placeholder="One specific behavior you will try" />
        </div>
        {error && <p id="j-err" role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit">{entry ? 'Save changes' : 'Save entry'}</Button>
          <Button variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
