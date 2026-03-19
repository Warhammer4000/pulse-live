import { NOTES, type MusicSheet } from "../notes";

const { G4, B4, D5, D4, A4, F4, E4, A3 } = NOTES;

export const ACOUSTIC_CORPORATE: MusicSheet = {
  name: "Acoustic Corporate",
  bpm: 105,
  melody: [
    G4,   null, B4,   G4,   D5,   null, B4,   null,
    D4,   null, A4,   D4,   F4,   null, A4,   null,
    G4,   null, E4,   null, G4,   A4,   B4,   null,
    D5,   null, B4,   G4,   A3,   null, null, null,
  ],
  kick: [
    true, false, false, false, true, false, false, false,
    true, false, false, false, true, false, false, false,
    true, false, false, false, true, false, false, false,
    true, false, false, false, true, false, false, false,
  ],
};
