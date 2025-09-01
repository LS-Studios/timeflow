export interface Session {
  type: 'work' | 'pause';
  start: Date;
  end: Date | null;
  note?: string;
}
