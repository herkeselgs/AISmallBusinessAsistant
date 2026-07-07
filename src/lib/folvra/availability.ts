import type { Slot } from "./types";

/**
 * Generate demo availability: the next `count` business-day slots at common
 * appointment times. In production this comes from Google Calendar freebusy;
 * for the demo it's deterministic so the experience is reproducible.
 */
export function generateSlots(
  opts: { durationMin?: number; count?: number; from?: Date } = {}
): Slot[] {
  const durationMin = opts.durationMin ?? 60;
  const count = opts.count ?? 3;
  const from = opts.from ?? new Date();

  const times = [9, 11, 14, 16]; // 9am, 11am, 2pm, 4pm
  const slots: Slot[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // start tomorrow

  let guard = 0;
  while (slots.length < count && guard < 30) {
    guard++;
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      for (const h of times) {
        if (slots.length >= count) break;
        const start = new Date(cursor);
        start.setHours(h, 0, 0, 0);
        slots.push({
          start: start.toISOString(),
          label: formatSlot(start),
          durationMin,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

function formatSlot(d: Date): string {
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${weekday} ${month} ${day}, ${h}:00 ${ampm}`;
}
