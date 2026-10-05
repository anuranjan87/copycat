export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#030712]">
      <div className="flex flex-col items-center gap-5">
        {/* Animated loader */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />

          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white" />

          <div className="absolute inset-[7px] rounded-full bg-white/5" />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-white/80">
            Loading editor...
          </p>

          <p className="mt-1 text-xs text-white/35">
            Preparing your workspace
          </p>
        </div>
      </div>
    </div>
  );
}