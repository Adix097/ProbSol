import { Video, FileText, GraduationCap, BookOpen, Book, Github, MousePointerClick, Link as LinkIcon } from 'lucide-react';

const ICONS = { video: Video, article: FileText, course: GraduationCap, docs: BookOpen, book: Book, repo: Github, interactive: MousePointerClick };

/** 28 -> "28 min", 90 -> "1 h 30 min", 120 -> "2 h" */
export function formatDuration(min) {
  if (!min || min <= 0) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// The whole card is one secure external link.
export default function ResourceCard({ resource }) {
  const Icon = ICONS[resource.type] || LinkIcon;
  const duration = formatDuration(resource.duration_minutes);
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
       className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white p-3 hover:border-brand">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand-dark">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{resource.title}</span>
        <span className="block text-xs text-ink/60">{resource.source}{duration && ` · ${duration}`}</span>
      </span>
    </a>
  );
}
