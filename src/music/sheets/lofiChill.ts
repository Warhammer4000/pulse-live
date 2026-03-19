import { NOTES, type MusicSheet } from "../notes";

const { E4, G4, A4, C4, D4 } = NOTES;

export const LOFI_CHILL: MusicSheet = {
  name: "Lo-Fi Chill",
  bpm: 80,
  melody: [
    E4,   null, G4,   null, A4,   null, G4,   null,
    E4,   null, C4,   null, D4,   null, null, null,
    G4,   null, A4,   G4,   E4,   null, D4,   null,
    C4,   null, E4,   null, G4,   null, null, null,
  ],
  kick: [
    true, false, false, false, false, false, false, false,
    true, false, false, false, false, false, false, false,
    true, false, false, false, false, false, false, false,
    true, false, false, false, false, false, false, false,
  ],
};
