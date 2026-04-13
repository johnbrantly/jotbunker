let enabled = false;
let sink: ((line: string) => void) | null = null;

export function setSyncLogEnabled(v: boolean): void {
  enabled = v;
}

export function setSyncLogSink(fn: ((line: string) => void) | null): void {
  sink = fn;
}

export function syncLog(tag: string, ...args: unknown[]): void {
  if (!enabled) return;
  const t = new Date().toISOString().slice(11, 23);
  const parts = args.map((a) =>
    typeof a === 'string' ? a : JSON.stringify(a),
  );
  const line = `[SYNC ${t}][${tag}] ${parts.join(' ')}`;
  if (sink) sink(line);
}
