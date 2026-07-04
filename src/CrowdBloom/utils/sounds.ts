let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function resumeAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* ignore */
  }
}

function tone(
  freq: number,
  duration: number,
  opts: {
    type?: OscillatorType;
    gain?: number;
    freqEnd?: number;
    delay?: number;
  } = {},
) {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime + (opts.delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(opts.gain ?? 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    /* ignore */
  }
}

export function playClick() {
  tone(620, 0.04, { type: 'triangle', freqEnd: 420, gain: 0.045 });
}

export function playPlant() {
  tone(392, 0.18, { gain: 0.065 });
  tone(523, 0.18, { gain: 0.055, delay: 0.025 });
  tone(659, 0.18, { gain: 0.045, delay: 0.05 });
}

export function playMissing() {
  tone(160, 0.12, { type: 'sawtooth', freqEnd: 120, gain: 0.035 });
}

export function playOpen() {
  tone(480, 0.08, { freqEnd: 720, gain: 0.04 });
}
