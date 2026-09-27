/**
 * Decorative background: bright airy gradient + floating glass blobs.
 * Purely presentational — position: fixed, pointer-events: none.
 */
export function GlassBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="glass-blob glass-float left-[-8%] top-[-12%] size-[42rem] bg-gradient-to-br from-sky-200/80 to-cyan-100/50" />
      <div
        className="glass-blob glass-float right-[-10%] top-[6%] size-[38rem] bg-gradient-to-br from-cyan-200/70 to-teal-100/50"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="glass-blob glass-float bottom-[-16%] left-[22%] size-[44rem] bg-gradient-to-br from-indigo-200/60 to-sky-100/40"
        style={{ animationDelay: "-8s" }}
      />
    </div>
  );
}
