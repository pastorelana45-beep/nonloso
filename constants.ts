
import { Instrument } from './types.ts';

export interface ExtendedInstrument extends Instrument {
  midiProgram: number;
}

export const SCALES = [
  { name: 'Cromatica (Libera)', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { name: 'Maggiore (C)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Minore Nat. (Am)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Pentatonica Maj', intervals: [0, 2, 4, 7, 9] },
  { name: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10] }
];

export const INSTRUMENTS: ExtendedInstrument[] = [
  // Pianos (0-7)
  { id: 'acoustic_grand_piano', name: 'Grand Piano', category: 'Piano', color: 'bg-blue-600', midiProgram: 0 },
  { id: 'bright_acoustic_piano', name: 'Bright Piano', category: 'Piano', color: 'bg-blue-400', midiProgram: 1 },
  { id: 'electric_grand_piano', name: 'E-Grand Piano', category: 'Piano', color: 'bg-cyan-600', midiProgram: 2 },
  { id: 'honkytonk_piano', name: 'Honky-tonk', category: 'Piano', color: 'bg-amber-600', midiProgram: 3 },
  { id: 'electric_piano_1', name: 'Rhodes Piano', category: 'Keys', color: 'bg-indigo-500', midiProgram: 4 },
  { id: 'electric_piano_2', name: 'Chorused EP', category: 'Keys', color: 'bg-indigo-400', midiProgram: 5 },
  { id: 'harpsichord', name: 'Harpsichord', category: 'Keys', color: 'bg-yellow-800', midiProgram: 6 },
  { id: 'clavinet', name: 'Clavinet', category: 'Keys', color: 'bg-orange-700', midiProgram: 7 },

  // Chromatic Percussion (8-15)
  { id: 'celesta', name: 'Celesta', category: 'Perc', color: 'bg-sky-300', midiProgram: 8 },
  { id: 'glockenspiel', name: 'Glockenspiel', category: 'Perc', color: 'bg-sky-200', midiProgram: 9 },
  { id: 'vibraphone', name: 'Vibraphone', category: 'Perc', color: 'bg-teal-400', midiProgram: 11 },
  { id: 'marimba', name: 'Marimba', category: 'Perc', color: 'bg-orange-900', midiProgram: 12 },
  { id: 'xylophone', name: 'Xylophone', category: 'Perc', color: 'bg-orange-800', midiProgram: 13 },

  // Organs (16-23)
  { id: 'drawbar_organ', name: 'Drawbar Organ', category: 'Organ', color: 'bg-red-900', midiProgram: 16 },
  { id: 'percussive_organ', name: 'Perc Organ', category: 'Organ', color: 'bg-red-800', midiProgram: 17 },
  { id: 'rock_organ', name: 'Rock Organ', category: 'Organ', color: 'bg-orange-600', midiProgram: 18 },
  { id: 'church_organ', name: 'Church Organ', category: 'Organ', color: 'bg-zinc-500', midiProgram: 19 },
  { id: 'accordion', name: 'Accordion', category: 'Organ', color: 'bg-emerald-700', midiProgram: 21 },

  // Guitars (24-31)
  { id: 'acoustic_guitar_nylon', name: 'Nylon Guitar', category: 'Guitar', color: 'bg-yellow-700', midiProgram: 24 },
  { id: 'acoustic_guitar_steel', name: 'Steel Guitar', category: 'Guitar', color: 'bg-yellow-600', midiProgram: 25 },
  { id: 'electric_guitar_jazz', name: 'Jazz Guitar', category: 'Guitar', color: 'bg-emerald-800', midiProgram: 26 },
  { id: 'electric_guitar_clean', name: 'Clean Electric', category: 'Guitar', color: 'bg-emerald-500', midiProgram: 27 },
  { id: 'distortion_guitar', name: 'Distortion Gt', category: 'Guitar', color: 'bg-red-600', midiProgram: 30 },

  // Bass (32-39)
  { id: 'acoustic_bass', name: 'Acoustic Bass', category: 'Bass', color: 'bg-stone-800', midiProgram: 32 },
  { id: 'electric_bass_finger', name: 'Finger Bass', category: 'Bass', color: 'bg-stone-700', midiProgram: 33 },
  { id: 'fretless_bass', name: 'Fretless Bass', category: 'Bass', color: 'bg-stone-600', midiProgram: 35 },
  { id: 'synth_bass_1', name: 'Synth Bass 1', category: 'Bass', color: 'bg-purple-900', midiProgram: 38 },
  { id: 'synth_bass_2', name: 'Synth Bass 2', category: 'Bass', color: 'bg-purple-800', midiProgram: 39 },

  // Strings (40-55)
  { id: 'violin', name: 'Violin', category: 'Strings', color: 'bg-rose-500', midiProgram: 40 },
  { id: 'viola', name: 'Viola', category: 'Strings', color: 'bg-rose-600', midiProgram: 41 },
  { id: 'cello', name: 'Cello', category: 'Strings', color: 'bg-red-800', midiProgram: 42 },
  { id: 'contrabass', name: 'Contrabass', category: 'Strings', color: 'bg-red-950', midiProgram: 43 },
  { id: 'pizzicato_strings', name: 'Pizzicato', category: 'Strings', color: 'bg-pink-400', midiProgram: 45 },
  { id: 'string_ensemble_1', name: 'Strings 1', category: 'Orch', color: 'bg-pink-600', midiProgram: 48 },
  { id: 'string_ensemble_2', name: 'Strings 2', category: 'Orch', color: 'bg-pink-700', midiProgram: 49 },

  // Brass (56-63)
  { id: 'trumpet', name: 'Trumpet', category: 'Brass', color: 'bg-amber-500', midiProgram: 56 },
  { id: 'trombone', name: 'Trombone', category: 'Brass', color: 'bg-amber-600', midiProgram: 57 },
  { id: 'tuba', name: 'Tuba', category: 'Brass', color: 'bg-amber-700', midiProgram: 58 },
  { id: 'french_horn', name: 'French Horn', category: 'Brass', color: 'bg-amber-800', midiProgram: 60 },
  { id: 'brass_section', name: 'Brass Section', category: 'Brass', color: 'bg-yellow-500', midiProgram: 61 },

  // Reed/Pipe (64-79)
  { id: 'soprano_sax', name: 'Soprano Sax', category: 'Reed', color: 'bg-purple-400', midiProgram: 64 },
  { id: 'alto_sax', name: 'Alto Sax', category: 'Reed', color: 'bg-purple-600', midiProgram: 65 },
  { id: 'tenor_sax', name: 'Tenor Sax', category: 'Reed', color: 'bg-purple-700', midiProgram: 66 },
  { id: 'baritone_sax', name: 'Baritone Sax', category: 'Reed', color: 'bg-purple-800', midiProgram: 67 },
  { id: 'clarinet', name: 'Clarinet', category: 'Reed', color: 'bg-lime-700', midiProgram: 71 },
  { id: 'flute', name: 'Flute', category: 'Pipe', color: 'bg-lime-400', midiProgram: 73 },
  { id: 'pan_flute', name: 'Pan Flute', category: 'Pipe', color: 'bg-lime-500', midiProgram: 75 },

  // Synth Lead (80-87)
  { id: 'lead_1_square', name: 'Square Lead', category: 'Synth', color: 'bg-cyan-400', midiProgram: 80 },
  { id: 'lead_2_sawtooth', name: 'Saw Lead', category: 'Synth', color: 'bg-cyan-500', midiProgram: 81 },
  { id: 'lead_3_calliope', name: 'Calliope Lead', category: 'Synth', color: 'bg-cyan-600', midiProgram: 82 },
  { id: 'lead_8_bass_lead', name: 'Bass + Lead', category: 'Synth', color: 'bg-blue-900', midiProgram: 87 },

  // Synth Pad (88-95)
  { id: 'pad_1_new_age', name: 'New Age Pad', category: 'Pad', color: 'bg-indigo-300', midiProgram: 88 },
  { id: 'pad_2_warm', name: 'Warm Pad', category: 'Pad', color: 'bg-indigo-400', midiProgram: 89 },
  { id: 'pad_3_polysynth', name: 'PolySynth Pad', category: 'Pad', color: 'bg-indigo-500', midiProgram: 90 },
  { id: 'pad_7_halo', name: 'Halo Pad', category: 'Pad', color: 'bg-indigo-600', midiProgram: 94 },

  // Ethnic (104-111)
  { id: 'sitar', name: 'Sitar', category: 'Ethnic', color: 'bg-orange-600', midiProgram: 104 },
  { id: 'banjo', name: 'Banjo', category: 'Ethnic', color: 'bg-orange-500', midiProgram: 105 },
  { id: 'shamisen', name: 'Shamisen', category: 'Ethnic', color: 'bg-orange-400', midiProgram: 106 },
  { id: 'kalimba', name: 'Kalimba', category: 'Ethnic', color: 'bg-orange-300', midiProgram: 108 }
];
