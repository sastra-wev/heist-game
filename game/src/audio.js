// audio.js — WebAudio-synthesised sounds only. No audio files: every
// effect is a short oscillator / noise burst built at run time.
let ctx = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

export function initAudio() {
  ensure();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = ensure();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch (e) {
    // Audio is decoration; never break the game for it.
  }
}

function noiseBurst(dur, vol) {
  if (muted) return;
  const ac = ensure();
  if (!ac) return;
  try {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.value = vol || 0.12;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch (e) {
    // ignore
  }
}

export const sfx = {
  footstep() {
    noiseBurst(0.05, 0.03);
  },
  pickup() {
    tone(880, 0.12, "sine", 0.1);
    setTimeout(() => tone(1318, 0.16, "sine", 0.1), 70);
  },
  alarmBlip() {
    tone(620, 0.14, "square", 0.06, 480);
  },
  smoke() {
    noiseBurst(0.4, 0.14);
  },
  emp() {
    tone(1200, 0.3, "sawtooth", 0.07, 120);
  },
  caught() {
    tone(220, 0.5, "sawtooth", 0.1, 110);
    setTimeout(() => tone(165, 0.7, "sawtooth", 0.1, 82), 200);
  },
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, "triangle", 0.11), i * 110));
  },
  click() {
    tone(700, 0.06, "sine", 0.06);
  },
};
