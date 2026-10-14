export const INPUT_CLASS =
  'w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal';

/** Labelled text input used by the admin and student sign-in cards. */
export default function FormField({ label, hint, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1.5">{label}</label>
      <input className={INPUT_CLASS} {...props} />
      {hint && <p className="text-[11px] text-ink-soft/80 mt-1">{hint}</p>}
    </div>
  );
}
