
export function detectPitch(buffer: Float32Array, sampleRate: number): { pitch: number; clarity: number } {
  // Calcolo energia per gate iniziale
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  const rms = Math.sqrt(sum / buffer.length);
  
  // Gate di rumore più intelligente: se il volume è troppo basso, non processare
  if (rms < 0.015) return { pitch: -1, clarity: 0 };

  const halfSize = Math.floor(buffer.length / 2);
  const yinBuffer = new Float32Array(halfSize);
  
  // Algoritmo YIN (Difference function)
  for (let tau = 0; tau < halfSize; tau++) {
    for (let i = 0; i < halfSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  // Normalizzazione YIN (Cumulative mean normalized difference)
  let runningSum = 0;
  yinBuffer[0] = 1;
  for (let tau = 1; tau < halfSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / (runningSum || 1);
  }

  let tauFound = -1;
  const threshold = 0.12; // Soglia più stretta per maggiore precisione sulle note 'pulite'
  
  for (let tau = 2; tau < halfSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      // Trovato un minimo locale sotto la soglia
      while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauFound = tau;
      break;
    }
  }

  // Se non troviamo nulla sotto soglia, proviamo il minimo assoluto (ma con meno confidenza)
  if (tauFound === -1) {
    let minVal = 1;
    for (let tau = 2; tau < halfSize; tau++) {
      if (yinBuffer[tau] < minVal) {
        minVal = yinBuffer[tau];
        tauFound = tau;
      }
    }
    // Se la chiarezza è pessima (> 0.35 in YIN normalizzato), scartiamo
    if (minVal > 0.35) return { pitch: -1, clarity: 0 };
    return { pitch: sampleRate / tauFound, clarity: 1 - minVal };
  }
  
  const pitch = sampleRate / tauFound;
  // Clarity è l'inverso dell'errore YIN
  const clarity = 1 - yinBuffer[tauFound];
  
  return { pitch, clarity };
}

export function midiToNoteName(midi: number): string {
  if (midi < 0) return "";
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}
