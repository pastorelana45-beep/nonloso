
export interface Instrument {
  id: string;
  name: string;
  category: string;
  color: string;
}

export interface NoteEvent {
  note: number;
  name: string;
  frequency: number;
  timestamp: number;
}

export interface PitchPoint {
  timeOffset: number;
  midi: number;
  cents: number;
}

export interface RecordedNote {
  midi: number;
  startTime: number;
  duration: number;
  pitchTrajectory: PitchPoint[];
}

export interface PitchData {
  pitch: number;
  clarity: number;
}
