export interface EspStatusResponse {
  temperature: number;
  waterLevel: number;
  tds: number;
  lightLevel: number;
  heater: boolean;
  airPump: boolean;
  light: boolean;
  fillPump: boolean;
  drainPump: boolean;
  feederDispensing?: boolean;
  uptimeSeconds?: number;
  rtcTime?: string;
  autoWaterChange?: boolean;
  waterChangePhase?: string;
}

export async function fetchEspStatus(ip: string, timeoutMs = 2500): Promise<EspStatusResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const res = await fetch(`http://${cleanIp}/api/status`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function sendEspDeviceCommand(
  ip: string,
  device: 'heater' | 'airPump' | 'light' | 'fillPump' | 'drainPump',
  state: boolean,
  timeoutMs = 3000
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const res = await fetch(`http://${cleanIp}/api/device?device=${device}&state=${state ? 1 : 0}`, {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[HardwareService] Failed to set device ${device}:`, err);
    return false;
  }
}

export async function sendEspFeedCommand(ip: string, timeoutMs = 3000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const res = await fetch(`http://${cleanIp}/api/feed`, {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch (err) {
    clearTimeout(timer);
    console.warn('[HardwareService] Failed to trigger feed:', err);
    return false;
  }
}

export async function sendEspWaterChangeCommand(
  ip: string,
  action: 'start' | 'abort',
  drainTo = 50,
  fillTo = 85,
  timeoutMs = 3000
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const res = await fetch(`http://${cleanIp}/api/waterchange?action=${action}&drainTo=${drainTo}&fillTo=${fillTo}`, {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch (err) {
    clearTimeout(timer);
    return false;
  }
}
