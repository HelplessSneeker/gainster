interface StaleDataAnnouncerProps {
  error: Error | null
}

export function StaleDataAnnouncer({ error }: StaleDataAnnouncerProps) {
  if (!error) return null
  return (
    <div role="status" aria-live="polite" className="sr-only">
      Data may be outdated. Background refresh failed.
    </div>
  )
}
