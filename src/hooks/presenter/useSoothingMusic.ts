import { useCallback, useEffect, useRef, useState } from "react";
import { type MusicSheet } from "@/music/notes";
import { ACOUSTIC_CORPORATE } from "@/music/sheets";

function playPluck(ctx: AudioContext, freq: number, time: number, vol: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.4);
}

function playKick(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

export function useSoothingMusic(sheet: MusicSheet = ACOUSTIC_CORPORATE) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);
  const sheetRef = useRef(sheet);
  useEffect(() => { sheetRef.current = sheet; }, [sheet]);

  const schedule = useCallback(() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    const { bpm, melody, kick } = sheetRef.current;
    const stepDuration = (60 / bpm) / 4;
    const s = stepRef.current % melody.length;

    if (kick[s % kick.length]) playKick(ctx, ctx.currentTime + 0.1);
    const note = melody[s];
    if (note != null) playPluck(ctx, note, ctx.currentTime + 0.1, 0.4);

    stepRef.current++;
    timerRef.current = setTimeout(schedule, stepDuration * 1000);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    ctxRef.current?.close();
    ctxRef.current = null;
    stepRef.current = 0;
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    ctxRef.current = new AudioContext();
    stepRef.current = 0;
    schedule();
    setPlaying(true);
  }, [schedule]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else start();
  }, [playing, stop, start]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return { playing, toggle };
}
