export type SensorStatus = 'normal' | 'attention' | 'critical' | 'offline';

export type DeviceKey = 'heater' | 'fillPump' | 'drainPump' | 'airPump' | 'light';

export interface TelemetryData {
  temperature: number;      // °C (e.g. 26.4)
  waterLevel: number;       // % (e.g. 82)
  tds: number;              // ppm (e.g. 285) - Total Dissolved Solids
  lightLevel: number;       // lux (e.g. 420)
  timestamp: string;
}

export interface TelemetryHistoryPoint extends TelemetryData {
  timeLabel: string;
}

export interface DeviceState {
  heater: {
    on: boolean;
    targetTemp: number;
    currentTemp: number;
    mode: 'auto' | 'manual';
    runtimeSeconds: number;
    powerWatts: number;
    isInterlocked: boolean;
    interlockReason?: string;
  };
  fillPump: {
    on: boolean;
    mode: 'auto' | 'manual';
    runtimeSeconds: number;
    powerWatts: number;
    isInterlocked: boolean;
    interlockReason?: string;
  };
  drainPump: {
    on: boolean;
    mode: 'auto' | 'manual';
    runtimeSeconds: number;
    powerWatts: number;
    isInterlocked: boolean;
    interlockReason?: string;
  };
  airPump: {
    on: boolean;
    mode: 'schedule' | 'manual';
    runtimeSeconds: number;
    powerWatts: number;
  };
  light: {
    on: boolean;
    mode: 'schedule' | 'manual';
    runtimeSeconds: number;
    powerWatts: number;
  };
}

export type CleaningCycleStatus =
  | 'idle'
  | 'draining'
  | 'refilling'
  | 'completed'
  | 'aborted';

export interface CleaningCycleState {
  status: CleaningCycleStatus;
  progress: number; // 0 to 100
  phase: string;
  currentDrainLevel: number;
  targetRefillLevel: number;
  startedAt: string | null;
  lastCompleted: string;
}

export interface DeviceEnergyItem {
  device: DeviceKey;
  label: string;
  runtimeFormatted: string;
  runtimeSeconds: number;
  energyWh: number;
  percentage: number;
  color: string;
}

export interface EnergyData {
  todayWh: number;
  thisWeekKwh: number;
  thisMonthKwh: number;
  isEstimated: boolean;
  energySavingMode: boolean;
  livePowerWatts: number;
  deviceBreakdown: DeviceEnergyItem[];
  history: Array<{
    time: string;
    totalWh: number;
    heater: number;
    waterPumps: number;
    oxygenPump: number;
    light: number;
  }>;
}

export interface AlertItem {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source: 'sensors' | 'cleaning' | 'safety' | 'controller' | 'feeder';
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  device: string;
  icon: string;
  event: string;
  duration: string;
  triggerType: 'Manual' | 'Scheduled' | 'Automatic';
}

// Fish Feeder Types
export type PortionSize = 'small' | 'medium' | 'large';

export interface FeedingScheduleSlot {
  id: string;
  time: string; // e.g. "08:00", "13:30", "19:00"
  label: string;
  portion: PortionSize;
  enabled: boolean;
  days: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

export interface FeederState {
  autoMode: boolean; // Master toggle for automatic feeding
  hopperLevelPercent: number; // 0 - 100%
  portionSize: PortionSize;
  lastFedTimestamp: string | null;
  lastFedSource: 'manual' | 'scheduled' | 'auto';
  nextFeedInSeconds: number; // live countdown
  schedules: FeedingScheduleSlot[];
  isDispensing: boolean;
  feedsTodayCount: number;
  maxDailyFeeds: number;
  timingMode: 'schedule';
  antiOverfeedWarning?: string;
}

export interface AutomationSettings {
  temperature: {
    enabled: boolean;
    targetTemp: number;
    hysteresis: number; // e.g. 0.3°C
  };
  waterLevel: {
    enabled: boolean;
    minThreshold: number; // e.g. 45% -> start fill
    targetThreshold: number; // e.g. 85% -> stop fill
    dangerLowThreshold: number; // e.g. 30% -> interlock heater
  };
  tds: {
    enabled: boolean;
    warningThreshold: number; // e.g. 320 ppm
    autoWaterChangeEnabled: boolean;
  };
  lighting: {
    enabled: boolean;
    onTime: string;  // e.g. "18:00"
    offTime: string; // e.g. "22:00"
  };
  oxygenPump: {
    enabled: boolean;
    onTime: string;  // e.g. "06:00"
    offTime: string; // e.g. "22:00"
  };
  feeding: {
    enabled: boolean;
    portion: PortionSize;
  };
}

export type ActiveTab =
  | 'overview'
  | 'monitoring'
  | 'water'
  | 'devices'
  | 'schedules'
  | 'energy'
  | 'alerts'
  | 'settings';

export interface SecurityState {
  isUnlocked: boolean;
  pinCode: string;
}
