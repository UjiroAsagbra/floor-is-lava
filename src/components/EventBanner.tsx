interface EventBannerProps {
  label: string | null;
  visible: boolean;
}

export function EventBanner({ label, visible }: EventBannerProps) {
  if (!visible || !label) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center px-4"
      role="status"
    >
      <p className="event-banner text-center text-3xl font-black uppercase tracking-widest text-orange-400 sm:text-5xl">
        {label}
      </p>
    </div>
  );
}