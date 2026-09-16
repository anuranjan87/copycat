export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-zinc-500">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-900" />
        </div>
        <p className="mt-4 text-sm">Loading website...</p>
      </div>
    </main>
  );
}
