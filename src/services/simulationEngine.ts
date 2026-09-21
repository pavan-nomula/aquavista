import {
  TelemetryData,
  DeviceState,
  CleaningCycleState,
  EnergyData,
  AutomationSettings,
  AlertItem,
  ActivityLogItem,
  TelemetryHistoryPoint,
  FeederState,
  FeedingScheduleSlot,
} from '../types/aquavista';

export const INITIAL_TELEMETRY: TelemetryData = {
  temperature: 26.4,
  waterLevel: 82.0,
  tds: 285,
  lightLevel: 420,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const INITIAL_DEVICES: DeviceState = {
  heater: {
    on: false,
    targetTemp: 26.0,
    currentTemp: 26.4,
    mode: 'auto',
    runtimeSeconds: 2 * 3600 + 35 * 60, // 2h 35m
    powerWatts: 50,
    isInterlocked: false,
  },
  airPump: {
    on: true,
    mode: 'schedule',
    runtimeSeconds: 8 * 3600 + 10 * 60, // 8h 10m
    powerWatts: 5,
  },
  light: {
    on: true,
    mode: 'schedule',
    runtimeSeconds: 4 * 3600, // 4h
    powerWatts: 10,
  },
  fillPump: {
    on: false,
    mode: 'auto',
    runtimeSeconds: 18 * 60, // 18 min
    powerWatts: 25,
    isInterlocked: false,
  },
  drainPump: {
    on: false,
    mode: 'manual',
    runtimeSeconds: 12 * 60, // 12 min
    powerWatts: 30,
    isInterlocked: false,
  },
};

export const INITIAL_AUTOMATION: AutomationSettings = {
  temperature: {
    enabled: true,
    targetTemp: 26.0,
    hysteresis: 0.3,
  },
  waterLevel: {
    enabled: true,
    minThreshold: 45,
    targetThreshold: 85,
    dangerLowThreshold: 30,
  },
  tds: {
    enabled: true,
    warningThreshold: 320,
    autoWaterChangeEnabled: false,
  },
  lighting: {
    enabled: true,
    onTime: '18:00',
    offTime: '22:00',
  },
  oxygenPump: {
    enabled: true,
    onTime: '06:00',
    offTime: '22:00',
  },
  feeding: {
    enabled: true,
    portion: 'medium',
  },
};

export function computeNextFeedSeconds(schedules: FeedingScheduleSlot[]): { seconds: number; nextSlot: FeedingScheduleSlot | null } {
  const enabled = schedules.filter(s => s.enabled);
  if (enabled.length === 0) return { seconds: 0, nextSlot: null };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sorted = [...enabled].sort((a, b) => {
    const [ha, ma] = a.time.split(':').map(Number);
    const [hb, mb] = b.time.split(':').map(Number);
    return (ha * 60 + ma) - (hb * 60 + mb);
  });

  for (const slot of sorted) {
    const [h, m] = slot.time.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    if (slotMinutes > currentMinutes) {
      const diffSecs = (slotMinutes - currentMinutes) * 60 - now.getSeconds();
      return { seconds: Math.max(1, diffSecs), nextSlot: slot };
    }
  }

  // Otherwise, first slot tomorrow morning
  const firstSlot = sorted[0];
  const [fh, fm] = firstSlot.time.split(':').map(Number);
  const minutesUntilMidnight = (24 * 60) - currentMinutes;
  const totalMinutes = minutesUntilMidnight + (fh * 60 + fm);
  const diffSecs = totalMinutes * 60 - now.getSeconds();
  return { seconds: Math.max(1, diffSecs), nextSlot: firstSlot };
}

const DEFAULT_SCHEDULES: FeedingScheduleSlot[] = [
  {
    id: 'sched-1',
    time: '08:00',
    label: 'Morning Nutrition',
    portion: 'medium',
    enabled: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 'sched-2',
    time: '13:30',
    label: 'Afternoon Snack',
    portion: 'small',
    enabled: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 'sched-3',
    time: '19:00',
    label: 'Evening Dinner',
    portion: 'medium',
    enabled: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
];

export const INITIAL_FEEDER: FeederState = {
  autoMode: true,
  hopperLevelPercent: 88,
  portionSize: 'medium',
  lastFedTimestamp: 'Today, 08:00 AM',
  lastFedSource: 'scheduled',
  nextFeedInSeconds: computeNextFeedSeconds(DEFAULT_SCHEDULES).seconds,
  isDispensing: false,
  feedsTodayCount: 1, // Safe count: 1 of 3
  maxDailyFeeds: 3, // Safe tropical fish limit (2-3 times/day)
  timingMode: 'schedule', // Realistic daily schedule
  schedules: DEFAULT_SCHEDULES,
};

export const INITIAL_CLEANING: CleaningCycleState = {
  status: 'idle',
  progress: 0,
  phase: 'Normal Monitoring',
  currentDrainLevel: 50,
  targetRefillLevel: 85,
  startedAt: null,
  lastCompleted: '2 days ago',
};

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alt-1',
    type: 'INFO',
    title: 'System Online',
    message: 'Controller connected. All telemetry synchronized.',
    timestamp: '10m ago',
    read: false,
    source: 'controller',
  },
  {
    id: 'alt-2',
    type: 'SUCCESS',
    title: 'Water Change Complete',
    message: 'Previous scheduled water change completed successfully.',
    timestamp: '2d ago',
    read: true,
    source: 'cleaning',
  },
];

export const INITIAL_ACTIVITY: ActivityLogItem[] = [
  {
    id: 'act-1',
    timestamp: '18:00',
    device: 'Aquarium Light',
    icon: 'Sun',
    event: 'Light ON (Scheduled)',
    duration: 'Active',
    triggerType: 'Scheduled',
  },
  {
    id: 'act-2',
    timestamp: '10:25',
    device: 'Heater',
    icon: 'Flame',
    event: 'Heater OFF (Target reached)',
    duration: '45m',
    triggerType: 'Automatic',
  },
  {
    id: 'act-3',
    timestamp: '08:10',
    device: 'Oxygen Pump',
    icon: 'Wind',
    event: 'Oxygen Pump ON (Daily schedule)',
    duration: 'Active',
    triggerType: 'Scheduled',
  },
];

export function generateInitialHistory(): TelemetryHistoryPoint[] {
  const points: TelemetryHistoryPoint[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    const hour = t.getHours().toString().padStart(2, '0') + ':00';
    const isDay = t.getHours() >= 8 && t.getHours() <= 20;
    const baseTemp = 26.2 + Math.sin(i * 0.3) * 0.3;
    const baseTds = 275 + (24 - i) * 0.4;
    const baseLux = isDay ? 380 + Math.sin((t.getHours() - 8) / 12 * Math.PI) * 140 : 25;

    points.push({
      temperature: Number(baseTemp.toFixed(1)),
      waterLevel: Number((83 - (24 - i) * 0.1).toFixed(1)),
      tds: Math.round(baseTds),
      lightLevel: Math.round(baseLux),
      timestamp: hour,
      timeLabel: hour,
    });
  }
  return points;
}

export function computeEnergyBreakdown(
  devices: DeviceState,
  energySavingMode: boolean
): EnergyData {
  const heaterWh = Math.round((devices.heater.powerWatts * devices.heater.runtimeSeconds) / 3600);
  const airWh = Math.round((devices.airPump.powerWatts * devices.airPump.runtimeSeconds) / 3600);
  const lightWh = Math.round((devices.light.powerWatts * devices.light.runtimeSeconds) / 3600);
  const pumpsWh = Math.round(
    (devices.fillPump.powerWatts * devices.fillPump.runtimeSeconds +
      devices.drainPump.powerWatts * devices.drainPump.runtimeSeconds) /
      3600
  );

  const totalWh = heaterWh + airWh + lightWh + pumpsWh;
  const ecoFactor = energySavingMode ? 0.9 : 1.0;
  const adjustedTodayWh = Math.round(totalWh * ecoFactor);

  const formatRuntime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const breakdown: EnergyData['deviceBreakdown'] = [
    {
      device: 'heater',
      label: 'Aquarium Heater',
      runtimeFormatted: formatRuntime(devices.heater.runtimeSeconds),
      runtimeSeconds: devices.heater.runtimeSeconds,
      energyWh: Math.round(heaterWh * ecoFactor),
      percentage: totalWh > 0 ? Math.round((heaterWh / totalWh) * 100) : 0,
      color: '#f43f5e',
    },
    {
      device: 'airPump',
      label: 'Oxygen Pump',
      runtimeFormatted: formatRuntime(devices.airPump.runtimeSeconds),
      runtimeSeconds: devices.airPump.runtimeSeconds,
      energyWh: Math.round(airWh * ecoFactor),
      percentage: totalWh > 0 ? Math.round((airWh / totalWh) * 100) : 0,
      color: '#00f5d4',
    },
    {
      device: 'light',
      label: 'Aquarium Light',
      runtimeFormatted: formatRuntime(devices.light.runtimeSeconds),
      runtimeSeconds: devices.light.runtimeSeconds,
      energyWh: Math.round(lightWh * ecoFactor),
      percentage: totalWh > 0 ? Math.round((lightWh / totalWh) * 100) : 0,
      color: '#38bdf8',
    },
    {
      device: 'fillPump',
      label: 'Water Pumps (Fill & Drain)',
      runtimeFormatted: formatRuntime(devices.fillPump.runtimeSeconds + devices.drainPump.runtimeSeconds),
      runtimeSeconds: devices.fillPump.runtimeSeconds + devices.drainPump.runtimeSeconds,
      energyWh: Math.round(pumpsWh * ecoFactor),
      percentage: totalWh > 0 ? Math.round((pumpsWh / totalWh) * 100) : 0,
      color: '#10b981',
    },
  ];

  let activeWatts = 0;
  if (devices.heater.on) activeWatts += devices.heater.powerWatts;
  if (devices.airPump.on) activeWatts += devices.airPump.powerWatts;
  if (devices.light.on) activeWatts += devices.light.powerWatts;
  if (devices.fillPump.on) activeWatts += devices.fillPump.powerWatts;
  if (devices.drainPump.on) activeWatts += devices.drainPump.powerWatts;

  const history = [
    { time: '00:00', totalWh: 18, heater: 12, waterPumps: 0, oxygenPump: 4, light: 2 },
    { time: '04:00', totalWh: 24, heater: 18, waterPumps: 0, oxygenPump: 4, light: 2 },
    { time: '08:00', totalWh: 62, heater: 38, waterPumps: 4, oxygenPump: 8, light: 12 },
    { time: '12:00', totalWh: 45, heater: 22, waterPumps: 0, oxygenPump: 8, light: 15 },
    { time: '16:00', totalWh: 54, heater: 28, waterPumps: 5, oxygenPump: 8, light: 13 },
    { time: '20:00', totalWh: 78, heater: 40, waterPumps: 0, oxygenPump: 10, light: 28 },
    { time: 'Now', totalWh: adjustedTodayWh, heater: heaterWh, waterPumps: pumpsWh, oxygenPump: airWh, light: lightWh },
  ];

  return {
    todayWh: adjustedTodayWh,
    thisWeekKwh: Number(((adjustedTodayWh * 6.8) / 1000).toFixed(2)),
    thisMonthKwh: Number(((adjustedTodayWh * 26.5) / 1000).toFixed(2)),
    isEstimated: true,
    energySavingMode,
    livePowerWatts: activeWatts,
    deviceBreakdown: breakdown,
    history,
  };
}
