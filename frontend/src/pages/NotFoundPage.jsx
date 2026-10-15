import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink/70">That address doesn't lead anywhere.</p>
      <Link to="/" className="mt-6 inline-block rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">Back to home</Link>
    </div>
  );
}
