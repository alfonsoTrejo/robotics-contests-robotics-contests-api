export type StatusResponse = {
  service: string;
  ok: boolean;
  timestamp: string;
  uptimeSec: number;
  env: string;
};