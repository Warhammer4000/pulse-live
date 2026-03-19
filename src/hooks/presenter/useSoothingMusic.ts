import { useCallback, useEffect, useRef, useState } from "react";
import { type RadioStation, STATIONS } from "@/music/stations";

export function useSoothingMusic() {
  const [playing, setPlaying] = useState(false);
  const [station, setStation] = useState<RadioStation>(STATIONS[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setPlaying(false);
  }, []);

  const play = useCallback((s: RadioStation) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(s.url);
    audio.volume = 0.5;
    audioRef.current = audio;
    audio.play().catch(() => {}); // browser may require user gesture — already satisfied by button click
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (playing) stop();
    else play(station);
  }, [playing, stop, play, station]);

  const selectStation = useCallback((s: RadioStation) => {
    setStation(s);
    if (playing) play(s); // swap stream immediately if already playing
  }, [playing, play]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return { playing, toggle, station, selectStation, stations: STATIONS };
}
