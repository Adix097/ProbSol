import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowDown, BookOpen, ChevronDown, CircleCheck, CircleDot, Clock3, Flag, FolderGit2, ListChecks, Sparkles, Trash2, Trophy, Zap } from 'lucide-react';
import { getProgress, getRoadmap, goalLabel, removeRoadmap, updateNodeStatus } from '../services/api';
import StatusControl from '../components/StatusControl';
import ResourceCard from '../components/ResourceCard';

const byOrder = (a, b) => a.order - b.order;
const STAGE_THEMES = [
  { accent: 'border-l-teal-500', badge: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500', wash: 'from-teal-50/80' },
  { accent: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', wash: 'from-amber-50/80' },
  { accent: 'border-l-indigo-500', badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500', wash: 'from-indigo-50/80' },
  { accent: 'border-l-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-800', dot: 'bg-fuchsia-500', wash: 'from-fuchsia-50/80' },
];

export default function RoadmapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rm, setRm] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState('');
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getRoadmap(id);
        if (cancelled) return;
        // Not finished yet? Send them to the loading screen.
        if (data.status !== 'ready') return navigate(`/roadmaps/${id}/generating`, { replace: true });
        setRm(data);
        const p = await getProgress(id);
        if (!cancelled) setProgress(p);
      } catch (e) { if (!cancelled) setError(e.message || 'Could not load this roadmap.'); }
    })();
    return () => { cancelled = true; };
  }, [id, navigate]);

  // Save the change, then re-fetch so totals/percentages always come from the backend.
  const setStatus = useCallback(async (nodeId, status) => {
    setSaving(nodeId);
    try {
      await updateNodeStatus(id, nodeId, status);
      setProgress(await getProgress(id));
    } catch (e) { setError(e.message || 'Could not save your progress.'); }
    finally { setSaving(''); }
  }, [id]);

  async function handleRemove() {
    if (!window.confirm('Remove this roadmap from your roadmaps?')) return;
    setRemoving(true);
    try {
      await removeRoadmap(id);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not remove this roadmap.');
      setRemoving(false);
    }
  }

  function continueLearning() {
    const nextId = progress?.summary.next_node_id;
    if (!nextId) return;
    const stage = rm.stages.find((s) => s.nodes.some((n) => n.id === nextId));
    if (stage) setCollapsed((c) => ({ ...c, [stage.id]: false })); // make sure it's visible
    // Wait a tick so a collapsed stage has rendered before scrolling.
    setTimeout(() => document.getElementById(`node-${nextId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  if (error && !rm) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p role="alert" className="text-red-700">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block font-medium text-brand underline">Back to dashboard</Link>
      </div>
    );
  }
  if (!rm) return <p className="px-4 py-24 text-center text-ink/60">Loading roadmap…</p>;

  const summary = progress?.summary;
  const statusOf = (nodeId) => progress?.nodes?.[nodeId]?.status || 'not_started'; // missing = not started
  const stages = [...rm.stages].sort(byOrder);
  const allNodes = stages.flatMap((stage) => stage.nodes);
  const completed = allNodes.filter((node) => statusOf(node.id) === 'completed').length;
  const inProgress = allNodes.filter((node) => statusOf(node.id) === 'in_progress').length;
  const resources = allNodes.reduce((count, node) => count + (node.resources?.length || 0), 0);
  const percent = summary?.percent_complete || 0;

  return (
    <div className="mx-auto max-w-6xl overflow-hidden px-4 pb-10 pt-6 sm:pt-10">
      <header className="surface-glass relative overflow-hidden rounded-[2rem] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl animate-float-gently" />
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-dark"><Sparkles className="h-3.5 w-3.5" aria-hidden /> {goalLabel(rm.goal)} path</span>
          <button type="button" onClick={handleRemove} disabled={removing}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-white/60 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Remove roadmap" aria-label="Remove roadmap">
            <Trash2 className="h-4 w-4" aria-hidden />
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
        <div className="relative mt-7 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-brand">Your next chapter</p>
            <h1 className="break-words text-3xl font-bold tracking-tight sm:text-5xl">{rm.topic}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/70">{rm.summary}</p>
          </div>
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full lg:mx-0" style={{ background: `conic-gradient(#0f766e ${percent}%, rgba(15,118,110,.12) 0)` }}>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#eef4f0] text-center shadow-inner">
              <span className="text-2xl font-bold text-brand-dark">{percent}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">complete</span>
            </div>
          </div>
        </div>
      </header>

      {summary && (
        <section aria-label="Overall progress" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-glass rounded-2xl p-4 transition hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm text-ink/60"><ListChecks className="h-4 w-4 text-brand" aria-hidden /> Steps complete</div>
            <p className="mt-2 text-2xl font-bold">{completed}<span className="text-base font-medium text-ink/40"> / {summary.total_nodes}</span></p>
          </div>
          <div className="surface-glass rounded-2xl p-4 transition hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm text-ink/60"><Zap className="h-4 w-4 text-amber-500" aria-hidden /> Current focus</div>
            <p className="mt-2 text-2xl font-bold">{inProgress || 'Ready'}<span className="text-base font-medium text-ink/40">{inProgress ? ' active' : ' to begin'}</span></p>
          </div>
          <div className="surface-glass rounded-2xl p-4 transition hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm text-ink/60"><BookOpen className="h-4 w-4 text-indigo-500" aria-hidden /> Curated resources</div>
            <p className="mt-2 text-2xl font-bold">{resources}</p>
          </div>
          <div className="surface-glass rounded-2xl p-4 transition hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm text-ink/60"><Clock3 className="h-4 w-4 text-fuchsia-500" aria-hidden /> Learning stages</div>
            <p className="mt-2 text-2xl font-bold">{stages.length}</p>
          </div>
        </section>
      )}

      {summary && (
        <section aria-label="Continue learning" className="surface-glass mt-5 rounded-2xl p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <span className="font-bold">Your momentum</span>
            <span className="text-sm text-ink/60">{summary.completed_nodes} of {summary.total_nodes} steps</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={summary.percent_complete} aria-valuemin={0} aria-valuemax={100}>
            <div className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-brand via-emerald-400 to-lime-300 transition-all" style={{ width: `${summary.percent_complete}%` }}>
              <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-white/40 animate-[shimmer_2.4s_infinite]" />
            </div>
          </div>
          {summary.next_node_id ? (
            <button onClick={continueLearning} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark animate-pulse-soft"><ArrowDown className="h-4 w-4" aria-hidden /> Continue where you left off</button>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-brand-dark"><Trophy className="h-4 w-4" aria-hidden /> You've completed every step. Excellent work!</p>
          )}
        </section>
      )}

      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-8 space-y-6">
        {stages.map((stage, stageIndex) => {
          const sp = summary?.stages?.[stage.id];
          const open = !collapsed[stage.id];
          const theme = STAGE_THEMES[stageIndex % STAGE_THEMES.length];
          return (
            <section id={`stage-${stage.id}`} key={stage.id} className={`animate-roadmap-in overflow-hidden rounded-2xl border border-l-4 border-white/80 bg-gradient-to-br ${theme.wash} to-white/80 shadow-sm ${theme.accent}`} style={{ animationDelay: `${stage.order * 90}ms` }}>
              <button onClick={() => setCollapsed((c) => ({ ...c, [stage.id]: open }))} aria-expanded={open}
                      className="flex w-full items-start gap-3 p-5 text-left transition hover:bg-brand-soft/25 sm:p-6">
                <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${theme.badge}`}>{String(stageIndex + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-xl font-bold"><span>{stage.title}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>{sp?.percent || 0}%</span></span>
                  <span className="mt-1 block text-ink/70">{stage.description}</span>
                  {sp && (
                    <span className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink/60">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-ink/10 sm:w-32"><span className="block h-full bg-brand" style={{ width: `${sp.percent}%` }} /></span>
                      {sp.completed} of {sp.total} done
                    </span>
                  )}
                </span>
                <ChevronDown className={`mt-1 h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
              </button>

              {open && (
                <ol className="relative space-y-4 border-t border-ink/10 p-5 before:absolute before:bottom-8 before:left-[1.65rem] before:top-8 before:w-px before:bg-brand/20 sm:p-6">
                  {[...stage.nodes].sort(byOrder).map((node) => (
                    <li key={node.id} id={`node-${node.id}`} className="relative scroll-mt-24 rounded-2xl border border-ink/10 bg-white/80 p-4 transition hover:border-brand/25 hover:shadow-sm sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="flex min-w-0 items-center gap-2 break-words font-bold">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-dark">{node.order}</span>
                          {node.type === 'project' && <FolderGit2 className="h-4 w-4 text-brand" aria-label="Project" />}
                          {node.title}
                        </h3>
                        <StatusControl value={statusOf(node.id)} disabled={saving === node.id} onChange={(s) => setStatus(node.id, s)} />
                      </div>
                      <p className="mt-2 text-ink/70">{node.description}</p>

                      {node.project && (
                        <div className="mt-4 space-y-3 rounded-2xl border border-brand/10 bg-brand-soft/45 p-4 text-sm">
                          {node.project.deliverable && <p><strong>Deliverable:</strong> {node.project.deliverable}</p>}
                          {node.project.requirements?.length > 0 && <div><strong>Requirements</strong><ul className="mt-1 list-disc space-y-1 pl-5">{node.project.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                          {node.project.milestones?.length > 0 && <div><strong>Milestones</strong><ol className="mt-1 list-decimal space-y-1 pl-5">{node.project.milestones.map((item) => <li key={item}>{item}</li>)}</ol></div>}
                          {node.project.acceptance_criteria?.length > 0 && <div><strong>Done when</strong><ul className="mt-1 list-disc space-y-1 pl-5">{node.project.acceptance_criteria.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                          {node.project.stretch_goals?.length > 0 && <div><strong>Stretch goals</strong><ul className="mt-1 list-disc space-y-1 pl-5">{node.project.stretch_goals.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                        </div>
                      )}

                      {node.limited_resources && (
                        <p className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> Few quality resources found for this topic.
                        </p>
                      )}

                      {/* Project nodes have no resources: render nothing, not an empty box */}
                      {node.resources.length > 0 && (
                        <div className="mt-3 grid gap-2">
                          {node.resources.map((r) => <ResourceCard key={r.id} resource={r} />)}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-ink/50"><CircleCheck className="h-4 w-4 text-brand" aria-hidden /> End of roadmap</p>
    </div>
  );
}
