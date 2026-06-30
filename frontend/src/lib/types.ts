export interface LogEntry {
  label: string;
  text: string;
}

export interface ProofResult<T> {
  success: boolean;
  proof: T | null;
  publicInputs: string[] | null;
  logs: LogEntry[];
}
