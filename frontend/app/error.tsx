"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel" role="alert">
      <h1>This view could not load</h1>
      <button onClick={reset}>Retry view</button>
    </section>
  );
}
