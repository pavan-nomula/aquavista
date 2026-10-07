import mqtt, { MqttClient } from 'mqtt';

export interface MqttStatusPayload {
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
}

const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
export const STATUS_TOPIC = 'aquavista/tank/pavan/status';
export const COMMAND_TOPIC = 'aquavista/tank/pavan/command';

let client: MqttClient | null = null;

export function initMqttSync(
  onStatus: (data: MqttStatusPayload) => void,
  onConnected: (connected: boolean) => void
) {
  if (client) {
    try {
      client.end(true);
    } catch {}
  }

  const clientId = 'aquavista_web_' + Math.random().toString(16).substring(2, 9);
  
  try {
    client = mqtt.connect(BROKER_URL, {
      clientId,
      clean: true,
      reconnectPeriod: 2500,
      connectTimeout: 5000,
    });

    client.on('connect', () => {
      onConnected(true);
      client?.subscribe(STATUS_TOPIC, { qos: 0 });
    });

    client.on('message', (topic, payload) => {
      if (topic === STATUS_TOPIC) {
        try {
          const str = payload.toString();
          const parsed = JSON.parse(str);
          onStatus(parsed);
        } catch (e) {
          console.warn('[MQTT] Parse error:', e);
        }
      }
    });

    client.on('offline', () => onConnected(false));
    client.on('close', () => onConnected(false));
    client.on('error', (err) => {
      console.warn('[MQTT] Connection error:', err);
      onConnected(false);
    });
  } catch (err) {
    console.warn('[MQTT] Init error:', err);
    onConnected(false);
  }

  return () => {
    if (client) {
      try {
        client.end(true);
      } catch {}
      client = null;
    }
  };
}

export function publishMqttCommand(device: string, state: boolean) {
  if (client && client.connected) {
    const payload = JSON.stringify({
      device,
      state: state ? 1 : 0,
      timestamp: Date.now(),
    });
    client.publish(COMMAND_TOPIC, payload);
  }
}

export function publishMqttFeed() {
  if (client && client.connected) {
    const payload = JSON.stringify({
      action: 'feed',
      timestamp: Date.now(),
    });
    client.publish(COMMAND_TOPIC, payload);
  }
}

export function publishMqttWaterChange(action: 'start' | 'abort') {
  if (client && client.connected) {
    const payload = JSON.stringify({
      action: 'waterchange',
      subAction: action,
      timestamp: Date.now(),
    });
    client.publish(COMMAND_TOPIC, payload);
  }
}
