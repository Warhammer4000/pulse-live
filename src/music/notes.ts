export const NOTES: Record<string, number> = {
  G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63,
  F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, D5: 587.33, E5: 659.25,
  G5: 783.99, A5: 880.0,
};

export interface MusicSheet {
  name: string;
  bpm: number;
  /** 32-step melody pattern — null = rest */
  melody: (number | null)[];
  /** 32-step kick pattern */
  kick: boolean[];
}
