export interface BillingCode {
  id: string;
  code: string;
  description?: string;
  minutesPerUnit: number;
  payPerUnit: number;
}

export interface TimeEntry {
  hour: number;
  minute: number; // 0 | 15 | 30 | 45
}
