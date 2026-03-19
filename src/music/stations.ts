export interface RadioStation {
  id: string;
  name: string;
  description: string;
  url: string;
}

// All streams from SomaFM — free, listener-supported, no ads.
// Personal use only per their terms: https://somafm.com/about/faq.html
export const STATIONS: RadioStation[] = [
  {
    id: "groove-salad",
    name: "Groove Salad",
    description: "Ambient / downtempo",
    url: "https://ice5.somafm.com/groovesalad-128-mp3",
  },
  {
    id: "drone-zone",
    name: "Drone Zone",
    description: "Atmospheric / space",
    url: "https://ice5.somafm.com/dronezone-128-mp3",
  },
  {
    id: "deep-space",
    name: "Deep Space",
    description: "Space ambient",
    url: "https://ice5.somafm.com/deepspaceone-128-mp3",
  },
  {
    id: "lush",
    name: "Lush",
    description: "Chillout / trip-hop",
    url: "https://ice5.somafm.com/lush-128-mp3",
  },
];
