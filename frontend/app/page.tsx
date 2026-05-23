export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          WorkLaneX
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Team workspace for shipping together
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          Tasks, docs, and updates in one place. Built for small software teams
          and project groups.
        </p>
        <p className="mt-8 text-sm text-zinc-500">
          App screens (login, dashboard, board) come in the next phases.
        </p>
      </main>
    </div>
  );
}
