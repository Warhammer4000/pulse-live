export function getParticipantId(): string {
  let id = localStorage.getItem("pulse_participant_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pulse_participant_id", id);
  }
  return id;
}

export function resolveOptions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null && "text" in item) return (item as { text: string }).text;
      return String(item);
    });
  }
  if (typeof raw === "string") {
    try { return resolveOptions(JSON.parse(raw)); } catch { return []; }
  }
  return [];
}

export interface OptionItemResolved {
  text: string;
  image_url?: string;
  is_correct?: boolean;
}

export function resolveOptionItems(raw: unknown): OptionItemResolved[] {
  if (!raw) return [];
  let arr: unknown[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  } else {
    return [];
  }
  return arr.map((item) => {
    if (typeof item === "string") return { text: item };
    if (typeof item === "object" && item !== null && "text" in item) return item as OptionItemResolved;
    return { text: String(item) };
  });
}

export function resolveRatingConfig(raw: unknown): { min: number; max: number } {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "min" in raw && "max" in raw) {
    return { min: Number((raw as any).min), max: Number((raw as any).max) };
  }
  return { min: 1, max: 5 };
}
