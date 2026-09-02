
export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#030712]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white" />
        </div>

        <p className="text-sm text-white/50">
          Loading editor...
        </p>
      </div>
    </div>
  );
}

