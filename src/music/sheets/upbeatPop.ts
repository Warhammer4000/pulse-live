import { NOTES, type MusicSheet } from "../notes";

const { G4, B4, D5, E5, A4, G5, B3 } = NOTES;

export const UPBEAT_POP: MusicSheet = {
  name: "Upbeat Pop",
  bpm: 120,
  melody: [
    G4,   B4,   D5,   null, E5,   null, D5,   B4,
    G4,   null, A4,   null, B4,   null, A4,   null,
    G4,   B4,   D5,   G5,   E5,   null, D5,   null,
    B4,   null, G4,   null, A4,   B3,   null, null,
  ],
  kick: [
    true, false, false, false, true, false, true,  false,
    true, false, false, false, true, false, false, false,
    true, false, false, false, true, false, true,  false,
    true, false, false, false, true, false, false, false,
  ],
};
