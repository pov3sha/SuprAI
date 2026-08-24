/**
 * Audio Notification Synthesizer using Web Audio API.
 * Generates a clean, modern dual-tone notification ping chime when the Manager finishes synthesizing a report.
 */

export function playPingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    
    // First tone (E6 - 1318.51 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime);

    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Second tone (B6 - 1975.53 Hz) starting slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1975.53, ctx.currentTime + 0.08);

    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.warn('Audio ping sound context warning:', e);
  }
}
