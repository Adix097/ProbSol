import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronDown, Flag, FolderGit2, Trash2 } from 'lucide-react';
import { getProgress, getRoadmap, goalLabel, removeRoadmap, updateNodeStatus } from '../services/api';
import StatusControl from '../components/StatusControl';
import ResourceCard from '../components/ResourceCard';

const byOrder = (a, b) => a.order - b.order;

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

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10">
      <header>
        <div className="flex items-start justify-between gap-4">
          <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-dark">{goalLabel(rm.goal)}</span>
          <button type="button" onClick={handleRemove} disabled={removing}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Remove roadmap" aria-label="Remove roadmap">
            <Trash2 className="h-4 w-4" aria-hidden />
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{rm.topic}</h1>
        <p className="mt-2 text-lg text-ink/70">{rm.summary}</p>
      </header>

      {summary && (
        <section aria-label="Overall progress" className="mt-8 rounded-lg border border-ink/10 bg-white p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-bold">{summary.percent_complete}% complete</span>
            <span className="text-sm text-ink/60">{summary.completed_nodes} of {summary.total_nodes} steps</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={summary.percent_complete} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-brand transition-all" style={{ width: `${summary.percent_complete}%` }} />
          </div>
          {summary.next_node_id ? (
            <button onClick={continueLearning} className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Continue where you left off</button>
          ) : (
            <p className="mt-4 text-sm font-medium text-brand-dark">You've completed every step.</p>
          )}
        </section>
      )}

      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-8 space-y-6">
        {[...rm.stages].sort(byOrder).map((stage) => {
          const sp = summary?.stages?.[stage.id];
          const open = !collapsed[stage.id];
          return (
            <section key={stage.id} className="rounded-lg border border-ink/10 bg-white">
              <button onClick={() => setCollapsed((c) => ({ ...c, [stage.id]: open }))} aria-expanded={open}
                      className="flex w-full items-start gap-3 p-5 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-bold">{stage.title}</span>
                  <span className="mt-1 block text-ink/70">{stage.description}</span>
                  {sp && (
                    <span className="mt-3 flex items-center gap-3 text-sm text-ink/60">
                      <span className="h-1.5 w-32 overflow-hidden rounded-full bg-ink/10"><span className="block h-full bg-brand" style={{ width: `${sp.percent}%` }} /></span>
                      {sp.completed} of {sp.total} done
                    </span>
                  )}
                </span>
                <ChevronDown className={`mt-1 h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
              </button>

              {open && (
                <ol className="space-y-4 border-t border-ink/10 p-5">
                  {[...stage.nodes].sort(byOrder).map((node) => (
                    <li key={node.id} id={`node-${node.id}`} className="scroll-mt-24 rounded-lg border border-ink/10 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="flex items-center gap-2 font-bold">
                          {node.type === 'project' && <FolderGit2 className="h-4 w-4 text-brand" aria-label="Project" />}
                          {node.title}
                        </h3>
                        <StatusControl value={statusOf(node.id)} disabled={saving === node.id} onChange={(s) => setStatus(node.id, s)} />
                      </div>
                      <p className="mt-1 text-ink/70">{node.description}</p>

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
      <p className="mt-6 flex items-center gap-2 text-sm text-ink/50"><Flag className="h-4 w-4" aria-hidden /> End of roadmap</p>
    </div>
  );
}
