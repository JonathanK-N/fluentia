/** Signal sonore discret de correction en direct, généré localement (aucun fichier audio). */
let context: AudioContext | null = null;

export function playVerdict(correct: boolean) {
  try {
    context ??= new AudioContext();
    const now = context.currentTime;
    // Juste : deux notes montantes ; faux : une note grave plus courte.
    const notes = correct ? [[660, 0], [880, 0.11]] : [[220, 0]];
    for (const [frequency, delay] of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = correct ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + (correct ? 0.18 : 0.3));
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.32);
    }
  } catch {
    // Le son est facultatif : un navigateur sans Web Audio garde la correction visuelle.
  }
}
