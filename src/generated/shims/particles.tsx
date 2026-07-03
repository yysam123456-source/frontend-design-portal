export default function Particles() {
  return <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_50%,rgba(186,230,253,.45),transparent_35%)] opacity-80" />
}
export async function initParticlesEngine(callback?: (engine: unknown) => Promise<void> | void) {
  await callback?.({})
}
export async function loadFull(_engine?: unknown) {
  return undefined
}
