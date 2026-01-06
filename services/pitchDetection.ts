export function detectPitch(buffer: Float32Array, sampleRate: number) {
  let n = buffer.length;
  let correlations = new Float32Array(n);

  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    correlations[lag] = sum;
  }

  let bestLag = -1;
  let bestCorrelation = -1;

  for (let lag = 20; lag < n; lag++) {
    if (correlations[lag] > bestCorrelation) {
      bestCorrelation = correlations[lag];
      bestLag = lag;
    }
  }

  const pitch = sampleRate / bestLag;
  const rms = Math.sqrt(correlations[0] / n);
  const clarity = bestCorrelation / correlations[0];

  return { pitch, clarity, volume: rms };
}

export function midiToNoteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const name = notes[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}
