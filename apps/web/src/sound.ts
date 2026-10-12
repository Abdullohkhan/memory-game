type Sfx = "flip" | "match" | "mismatch" | "win" | "lose";

const NOTES: Record<Sfx, number[]> = {
  flip: [520],
  match: [660, 880],
  mismatch: [220],
  win: [523, 659, 784, 1046],
  lose: [330, 262, 196],
};

let ctx: AudioContext | null = null;

/** Tiny synthesized sound effects (no audio files). Silent if Web Audio is unavailable. */
export function playSfx(name: Sfx): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime;
    NOTES[name].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      const t = start + i * 0.11;
      osc.type = name === "mismatch" ? "sawtooth" : "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {
    /* audio blocked or unsupported */
  }
}
