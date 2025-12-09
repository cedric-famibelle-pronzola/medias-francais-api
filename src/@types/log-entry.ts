export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  method: string;
  path: string;
  query: string;
  status: number;
  duration: number;
  ip: string;
  userAgent: string;
  requestId: string;
  referer?: string;
}
