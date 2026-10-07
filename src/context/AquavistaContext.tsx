import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  TelemetryData,
  TelemetryHistoryPoint,
  DeviceState,
  CleaningCycleState,
  EnergyData,
  AutomationSettings,
  AlertItem,
  ActivityLogItem,
  ActiveTab,
  DeviceKey,
  CleaningCycleStatus,
  FeederState,
  PortionSize,
  FeedingScheduleSlot,
} from '../types/aquavista';
import {
  INITIAL_TELEMETRY,
  INITIAL_DEVICES,
  INITIAL_AUTOMATION,
  INITIAL_CLEANING,
  INITIAL_ALERTS,
  INITIAL_ACTIVITY,
  INITIAL_FEEDER,
  generateInitialHistory,
  computeEnergyBreakdown,
  computeNextFeedSeconds,
} from '../services/simulationEngine';
import {
  fetchEspStatus,
  sendEspDeviceCommand,
  sendEspFeedCommand,
  sendEspWaterChangeCommand,
} from '../services/hardwareService';
import {
  initMqttSync,
  publishMqttCommand,
  publishMqttFeed,
  publishMqttWaterChange,
} from '../services/mqttService';

interface AquavistaContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // ESP32 Hardware IP
  esp32Ip: string;
  setEsp32Ip: (ip: string) => void;

  // 4 Core Sensors
  telemetry: TelemetryData;
  telemetryHistory: TelemetryHistoryPoint[];
  connectionStatus: 'connected' | 'offline';
  setConnectionStatus: (status: 'connected' | 'offline') => void;
  lastSyncSecondsAgo: number;

  // 5 Actuators
  devices: DeviceState;
  toggleDevice: (device: DeviceKey) => void;
  setHeaterTarget: (temp: number) => void;

  // Safety Interlocks
  safetyNotice: string | null;
  clearSafetyNotice: () => void;

  // Water Management
  cleaningState: CleaningCycleState;
  startWaterChange: (drainTo?: number, fillTo?: number) => void;
  abortWaterChange: () => void;

  // Schedules & Automation
  automation: AutomationSettings;
  updateAutomation: (settings: Partial<AutomationSettings>) => void;

  // Fish Feeder & Auto Scheduling
  feeder: FeederState;
  triggerFeed: (portion?: PortionSize, source?: 'manual' | 'scheduled' | 'auto') => void;
  updateFeederSettings: (settings: Partial<FeederState>) => void;
  addFeedingSchedule: (slot: Omit<FeedingScheduleSlot, 'id'>) => void;
  toggleFeedingSchedule: (id: string) => void;
  deleteFeedingSchedule: (id: string) => void;
  refillFoodHopper: () => void;
  feedEventTrigger: number;

  // Energy
  energy: EnergyData;
  toggleEnergySavingMode: () => void;

  // Alerts & Activity
  alerts: AlertItem[];
  markAlertRead: (id: string) => void;
  clearAlerts: () => void;
  activityLog: ActivityLogItem[];

  // Demo Simulation Mode
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

const AquavistaContext = createContext<AquavistaContextType | null>(null);

export const AquavistaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryPoint[]>(() => generateInitialHistory());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline'>('connected');
  const [lastSyncSecondsAgo, setLastSyncSecondsAgo] = useState(0);

  const lastDataReceivedTime = useRef<number>(Date.now());
  const mqttConnectedRef = useRef<boolean>(false);

  const [devices, setDevices] = useState<DeviceState>(INITIAL_DEVICES);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

  const [cleaningState, setCleaningState] = useState<CleaningCycleState>(INITIAL_CLEANING);
  const [automation, setAutomation] = useState<AutomationSettings>(INITIAL_AUTOMATION);
  const [energySavingMode, setEnergySavingMode] = useState(false);

  // Fish Feeder State
  const [feeder, setFeeder] = useState<FeederState>(INITIAL_FEEDER);
  const [feedEventTrigger, setFeedEventTrigger] = useState<number>(0);

  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY);

  // ESP32 Hardware IP Address
  const [esp32Ip, setEsp32IpState] = useState<string>(() => {
    const stored = localStorage.getItem('aquavista_esp32_ip');
    if (!stored || stored === '192.168.1.100') {
      localStorage.setItem('aquavista_esp32_ip', '192.168.1.39');
      return '192.168.1.39';
    }
    return stored;
  });

  const setEsp32Ip = useCallback((newIp: string) => {
    const clean = newIp.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    setEsp32IpState(clean);
    localStorage.setItem('aquavista_esp32_ip', clean);
  }, []);

  // Demo Mode: Default to FALSE (Live Hardware Mode) so real data shows immediately!
  const [demoMode, setDemoModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('aquavista_demo_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const setDemoMode = useCallback((val: boolean) => {
    setDemoModeState(val);
    localStorage.setItem('aquavista_demo_mode', String(val));
  }, []);

  // Helper to add activity
  const addActivity = useCallback((device: string, icon: string, event: string, triggerType: 'Manual' | 'Scheduled' | 'Automatic', duration = 'Active') => {
    const newAct: ActivityLogItem = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      device,
      icon,
      event,
      duration,
      triggerType,
    };
    setActivityLog(prev => [newAct, ...prev.slice(0, 30)]);
  }, []);

  // Helper to add alert
  const addAlert = useCallback((type: AlertItem['type'], title: string, message: string, source: AlertItem['source']) => {
    const newAlert: AlertItem = {
      id: 'alt-' + Date.now(),
      type,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      source,
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const clearSafetyNotice = useCallback(() => setSafetyNotice(null), []);

  // Device control with genuine safety locks
  const toggleDevice = useCallback((key: DeviceKey) => {
    setDevices(prev => {
      const current = prev[key];
      const nextOn = !current.on;

      // 1. SAFETY: Low water heater lockout (< 30%)
      if (key === 'heater' && nextOn && telemetry.waterLevel < 30) {
        setSafetyNotice('Heater disabled — low water level (below 30% safe cutoff)');
        return {
          ...prev,
          heater: { ...prev.heater, on: false, isInterlocked: true, interlockReason: 'Low water level (< 30%)' },
        };
      }

      // 2. SAFETY: Mutex on fill and drain pumps
      if (key === 'fillPump' && nextOn && prev.drainPump.on) {
        setSafetyNotice('Safety Interlock: Drain pump stopped to avoid simultaneous drain and fill.');
        addActivity('Drain Pump', 'ArrowDownCircle', 'Auto-stopped (Mutual exclusion)', 'Automatic');
        return {
          ...prev,
          fillPump: { ...prev.fillPump, on: true, isInterlocked: false },
          drainPump: { ...prev.drainPump, on: false, isInterlocked: false },
        };
      }

      if (key === 'drainPump' && nextOn && prev.fillPump.on) {
        setSafetyNotice('Safety Interlock: Fill pump stopped to avoid simultaneous fill and drain.');
        addActivity('Fill Pump', 'ArrowUpCircle', 'Auto-stopped (Mutual exclusion)', 'Automatic');
        return {
          ...prev,
          drainPump: { ...prev.drainPump, on: true, isInterlocked: false },
          fillPump: { ...prev.fillPump, on: false, isInterlocked: false },
        };
      }

      // Record activity
      const label = key === 'heater' ? 'Heater' :
                    key === 'airPump' ? 'Oxygen Pump' :
                    key === 'light' ? 'Aquarium Light' :
                    key === 'fillPump' ? 'Fill Pump' : 'Drain Pump';
      const icon = key === 'heater' ? 'Flame' :
                   key === 'airPump' ? 'Wind' :
                   key === 'light' ? 'Sun' :
                   key === 'fillPump' ? 'ArrowUpCircle' : 'ArrowDownCircle';
      addActivity(label, icon, `${label} turned ${nextOn ? 'ON' : 'OFF'}`, 'Manual');

      if (!demoMode) {
        publishMqttCommand(key, nextOn);
        if (connectionStatus === 'connected') {
          sendEspDeviceCommand(esp32Ip, key, nextOn);
        }
      }

      return {
        ...prev,
        [key]: {
          ...current,
          on: nextOn,
          isInterlocked: false,
          interlockReason: undefined,
        },
      };
    });
  }, [connectionStatus, telemetry.waterLevel, addActivity, demoMode, esp32Ip]);

  const setHeaterTarget = useCallback((temp: number) => {
    setDevices(prev => ({
      ...prev,
      heater: { ...prev.heater, targetTemp: Number(temp.toFixed(1)) },
    }));
    setAutomation(prev => ({
      ...prev,
      temperature: { ...prev.temperature, targetTemp: Number(temp.toFixed(1)) },
    }));
  }, []);

  // Simple 3-Phase Water Change (Drain -> Refill -> Complete)
  const startWaterChange = useCallback((drainTo = 50, fillTo = 85) => {
    if (connectionStatus === 'offline') {
      setSafetyNotice('Cannot start water change: Controller is OFFLINE.');
      return;
    }

    setCleaningState({
      status: 'draining',
      progress: 25,
      phase: 'Draining Tank',
      currentDrainLevel: drainTo,
      targetRefillLevel: fillTo,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastCompleted: cleaningState.lastCompleted,
    });

    setDevices(d => ({ ...d, drainPump: { ...d.drainPump, on: true }, fillPump: { ...d.fillPump, on: false } }));
    addActivity('Drain Pump', 'ArrowDownCircle', `Water change started: Draining to ${drainTo}%`, 'Manual');
    addAlert('INFO', 'Water Change Started', `Draining water to ${drainTo}% before fresh refill.`, 'cleaning');

    if (!demoMode) {
      publishMqttWaterChange('start');
      if (connectionStatus === 'connected') {
        sendEspWaterChangeCommand(esp32Ip, 'start', drainTo, fillTo);
      }
    }
  }, [connectionStatus, cleaningState.lastCompleted, addActivity, addAlert, demoMode, esp32Ip]);

  const abortWaterChange = useCallback(() => {
    setCleaningState(prev => ({
      ...prev,
      status: 'aborted',
      phase: 'Water Change Cancelled',
    }));
    setDevices(d => ({
      ...d,
      drainPump: { ...d.drainPump, on: false },
      fillPump: { ...d.fillPump, on: false },
    }));
    addActivity('Water Management', 'AlertTriangle', 'Water change cancelled by user', 'Manual');
    addAlert('WARNING', 'Water Change Cancelled', 'Pumps stopped. Normal monitoring resumed.', 'cleaning');

    if (!demoMode) {
      publishMqttWaterChange('abort');
      if (connectionStatus === 'connected') {
        sendEspWaterChangeCommand(esp32Ip, 'abort');
      }
    }
  }, [addActivity, addAlert, demoMode, esp32Ip]);

  const updateAutomation = useCallback((newSettings: Partial<AutomationSettings>) => {
    setAutomation(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Fish Feeder actions with Anti-Overfeeding Safety Protection
  const triggerFeed = useCallback((portion?: PortionSize, source: 'manual' | 'scheduled' | 'auto' = 'manual') => {
    const chosenPortion = portion || feeder.portionSize;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isOverfeedRisk = feeder.feedsTodayCount >= feeder.maxDailyFeeds;

    setFeeder(prev => {
      const nextCount = prev.feedsTodayCount + 1;
      const nextSecs = prev.timingMode === 'demo' ? 120 : computeNextFeedSeconds(prev.schedules).seconds;
      return {
        ...prev,
        isDispensing: true,
        lastFedTimestamp: `Today, ${nowStr}`,
        lastFedSource: source,
        feedsTodayCount: nextCount,
        hopperLevelPercent: Math.max(0, prev.hopperLevelPercent - (chosenPortion === 'large' ? 2 : 1)),
        nextFeedInSeconds: nextSecs,
        antiOverfeedWarning: nextCount > prev.maxDailyFeeds
          ? `High feeding frequency (${nextCount}/${prev.maxDailyFeeds} feeds today). Excess food leads to ammonia spike.`
          : undefined,
      };
    });

    setFeedEventTrigger(c => c + 1);

    const portionLabel = chosenPortion === 'small' ? 'Light' : chosenPortion === 'large' ? 'Generous' : 'Standard';
    const triggerType = source === 'scheduled' ? 'Scheduled' : source === 'auto' ? 'Automatic' : 'Manual';

    addActivity('Fish Feeder', 'Utensils', `Dispensed ${portionLabel} portion (${source.toUpperCase()})`, triggerType);

    if (isOverfeedRisk) {
      addAlert('WARNING', 'Anti-Overfeed Warning', `Fish fed ${feeder.feedsTodayCount + 1} times today (recommended max: ${feeder.maxDailyFeeds}/day). Overfeeding pollutes water with toxic ammonia and causes swim-bladder bloat.`, 'feeder');
    } else {
      addAlert('SUCCESS', 'Fish Feeder Dispensed', `${portionLabel} portion of nutrient flakes dispensed for fishes.`, 'feeder');
    }

    if (!demoMode) {
      publishMqttFeed();
      if (connectionStatus === 'connected') {
        sendEspFeedCommand(esp32Ip);
      }
    }

    setTimeout(() => {
      setFeeder(prev => ({ ...prev, isDispensing: false }));
    }, 2500);
  }, [feeder.portionSize, feeder.feedsTodayCount, feeder.maxDailyFeeds, addActivity, addAlert, demoMode, esp32Ip, connectionStatus]);

  const updateFeederSettings = useCallback((settings: Partial<FeederState>) => {
    setFeeder(prev => ({ ...prev, ...settings }));
    if (settings.autoMode !== undefined) {
      addActivity('Fish Feeder', 'Settings', `Auto Feeding Mode ${settings.autoMode ? 'ENABLED' : 'DISABLED'}`, 'Manual');
    }
  }, [addActivity]);

  const addFeedingSchedule = useCallback((slot: Omit<FeedingScheduleSlot, 'id'>) => {
    const newSlot: FeedingScheduleSlot = {
      ...slot,
      id: 'sched-' + Date.now(),
    };
    setFeeder(prev => ({
      ...prev,
      schedules: [...prev.schedules, newSlot].sort((a, b) => a.time.localeCompare(b.time)),
    }));
    addActivity('Fish Feeder', 'Clock', `Added feeding schedule at ${slot.time} (${slot.portion})`, 'Manual');
  }, [addActivity]);

  const toggleFeedingSchedule = useCallback((id: string) => {
    setFeeder(prev => ({
      ...prev,
      schedules: prev.schedules.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }));
  }, []);

  const deleteFeedingSchedule = useCallback((id: string) => {
    setFeeder(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== id),
    }));
    addActivity('Fish Feeder', 'Trash2', 'Removed feeding schedule slot', 'Manual');
  }, [addActivity]);

  const refillFoodHopper = useCallback(() => {
    setFeeder(prev => ({ ...prev, hopperLevelPercent: 100 }));
    addActivity('Fish Feeder', 'PackageCheck', 'Food hopper refilled to 100%', 'Manual');
    addAlert('INFO', 'Food Hopper Refilled', 'Smart feeder container has been filled to capacity.', 'feeder');
  }, [addActivity, addAlert]);

  const toggleEnergySavingMode = useCallback(() => {
    setEnergySavingMode(prev => {
      const next = !prev;
      addActivity('Energy', 'Leaf', next ? 'Energy Saving Mode ON' : 'Energy Saving Mode OFF', 'Manual');
      return next;
    });
  }, [addActivity]);

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  const energy = computeEnergyBreakdown(devices, energySavingMode);

  // REAL-TIME BACKGROUND CLOCK & SIMULATION TICK (every 1 second)
  useEffect(() => {
    if (connectionStatus === 'offline') return;

    const interval = setInterval(() => {
      setLastSyncSecondsAgo(prev => (prev > 15 ? 1 : prev + 1));

      // Advance runtime for active actuators
      setDevices(prev => ({
        ...prev,
        heater: prev.heater.on ? { ...prev.heater, runtimeSeconds: prev.heater.runtimeSeconds + 1 } : prev.heater,
        airPump: prev.airPump.on ? { ...prev.airPump, runtimeSeconds: prev.airPump.runtimeSeconds + 1 } : prev.airPump,
        light: prev.light.on ? { ...prev.light, runtimeSeconds: prev.light.runtimeSeconds + 1 } : prev.light,
        fillPump: prev.fillPump.on ? { ...prev.fillPump, runtimeSeconds: prev.fillPump.runtimeSeconds + 1 } : prev.fillPump,
        drainPump: prev.drainPump.on ? { ...prev.drainPump, runtimeSeconds: prev.drainPump.runtimeSeconds + 1 } : prev.drainPump,
      }));

      // Automatic Fish Feeder: Realistic Schedule Mode vs Rapid Demo
      setFeeder(prev => {
        if (!prev.autoMode) return prev;

        if (prev.timingMode === 'demo') {
          // Rapid Demo mode
          if (prev.nextFeedInSeconds <= 1) {
            setTimeout(() => {
              triggerFeed(prev.portionSize, 'auto');
            }, 0);
            return {
              ...prev,
              nextFeedInSeconds: 120,
            };
          }
          return {
            ...prev,
            nextFeedInSeconds: prev.nextFeedInSeconds - 1,
          };
        } else {
          // Realistic Schedule Mode (Follows 2-3 daily feeding times)
          const { seconds, nextSlot } = computeNextFeedSeconds(prev.schedules);
          const now = new Date();
          const currentHM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

          // If current real clock hits the scheduled time at the start of the minute
          if (now.getSeconds() === 0 && nextSlot && nextSlot.time === currentHM && nextSlot.enabled) {
            setTimeout(() => {
              triggerFeed(nextSlot.portion, 'scheduled');
            }, 0);
          }

          return {
            ...prev,
            nextFeedInSeconds: seconds,
          };
        }
      });

      // If demoMode is enabled, simulate realistic natural sensor dynamics
      if (demoMode) {
        setTelemetry(prev => {
          let newTemp = prev.temperature;
          let newLevel = prev.waterLevel;
          let newTds = prev.tds;

          // Temperature: Heater heats, ambient slowly cools
          if (devices.heater.on) {
            const delta = (devices.heater.targetTemp - newTemp) * 0.02;
            newTemp += Math.max(0.01, delta);
          } else {
            const ambient = 23.0;
            newTemp -= (newTemp - ambient) * 0.005;
          }

          // Water Level & TDS
          if (devices.fillPump.on) {
            newLevel = Math.min(100, newLevel + 0.5);
            newTds = Math.max(160, newTds - 0.7); // dilution
          }
          if (devices.drainPump.on) {
            newLevel = Math.max(10, newLevel - 0.8);
          }
          if (!devices.fillPump.on && !devices.drainPump.on) {
            newLevel = Math.max(0, newLevel - 0.002);
            newTds = Math.min(500, newTds + 0.01);
          }

          const lightVal = devices.light.on ? 420 : 45;

          return {
            temperature: Number(newTemp.toFixed(1)),
            waterLevel: Number(newLevel.toFixed(1)),
            tds: Math.round(newTds),
            lightLevel: lightVal,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
      }

      // Safety check: Heater lockout if level < 30%
      setDevices(prev => {
        if (telemetry.waterLevel < 30 && prev.heater.on) {
          setSafetyNotice('Heater disabled — low water level');
          addActivity('Heater', 'Flame', 'Heater auto cut-off: Low water (< 30%)', 'Automatic');
          return {
            ...prev,
            heater: { ...prev.heater, on: false, isInterlocked: true, interlockReason: 'Low water level (< 30%)' },
          };
        }
        if (telemetry.waterLevel >= 30 && prev.heater.isInterlocked) {
          return {
            ...prev,
            heater: { ...prev.heater, isInterlocked: false, interlockReason: undefined },
          };
        }
        return prev;
      });

      // Simple 3-phase water change progression (Drain -> Refill -> Complete)
      setCleaningState(prev => {
        if (prev.status === 'idle' || prev.status === 'completed' || prev.status === 'aborted') {
          return prev;
        }

        let nextStatus: CleaningCycleStatus = prev.status;
        let nextProgress = prev.progress;
        let nextPhase = prev.phase;

        if (prev.status === 'draining') {
          nextProgress = Math.min(60, prev.progress + 3);
          if (telemetry.waterLevel <= prev.currentDrainLevel || nextProgress >= 60) {
            nextStatus = 'refilling';
            nextPhase = 'Refilling Tank with Fresh Water';
            setDevices(d => ({ ...d, drainPump: { ...d.drainPump, on: false }, fillPump: { ...d.fillPump, on: true } }));
            addActivity('Fill Pump', 'ArrowUpCircle', 'Drain complete. Refilling tank.', 'Automatic');
          }
        } else if (prev.status === 'refilling') {
          nextProgress = Math.min(100, prev.progress + 3);
          if (telemetry.waterLevel >= prev.targetRefillLevel || nextProgress >= 100) {
            nextStatus = 'completed';
            nextPhase = 'Water Change Complete';
            setDevices(d => ({ ...d, fillPump: { ...d.fillPump, on: false } }));
            addActivity('Water Management', 'CheckCircle', 'Water change complete', 'Automatic');
            addAlert('SUCCESS', 'Water Change Complete', `Aquarium replenished to ${telemetry.waterLevel.toFixed(0)}% level.`, 'cleaning');
            return {
              ...prev,
              status: 'completed',
              progress: 100,
              phase: 'Water Change Complete',
              lastCompleted: 'Today (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
            };
          }
        }

        return {
          ...prev,
          status: nextStatus,
          progress: nextProgress,
          phase: nextPhase,
        };
      });

      // Automation: Temperature control with hysteresis
      if (automation.temperature.enabled && cleaningState.status === 'idle') {
        const { targetTemp, hysteresis } = automation.temperature;
        if (telemetry.temperature < targetTemp - hysteresis && !devices.heater.on && telemetry.waterLevel >= 30) {
          setDevices(d => ({ ...d, heater: { ...d.heater, on: true } }));
          addActivity('Heater', 'Flame', `Heater ON (Temp ${telemetry.temperature}°C < ${targetTemp - hysteresis}°C)`, 'Automatic');
        } else if (telemetry.temperature >= targetTemp && devices.heater.on) {
          setDevices(d => ({ ...d, heater: { ...d.heater, on: false } }));
          addActivity('Heater', 'Flame', `Heater OFF (Target ${targetTemp}°C reached)`, 'Automatic');
        }
      }

      // Automation: Water level replenishment
      if (automation.waterLevel.enabled && cleaningState.status === 'idle') {
        if (telemetry.waterLevel < automation.waterLevel.minThreshold && !devices.fillPump.on && !devices.drainPump.on) {
          setDevices(d => ({ ...d, fillPump: { ...d.fillPump, on: true } }));
          addActivity('Fill Pump', 'ArrowUpCircle', `Auto-fill started (Water level < ${automation.waterLevel.minThreshold}%)`, 'Automatic');
        } else if (telemetry.waterLevel >= automation.waterLevel.targetThreshold && devices.fillPump.on) {
          setDevices(d => ({ ...d, fillPump: { ...d.fillPump, on: false } }));
          addActivity('Fill Pump', 'ArrowUpCircle', `Auto-fill stopped (Target ${automation.waterLevel.targetThreshold}% reached)`, 'Automatic');
        }
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [
    connectionStatus,
    demoMode,
    devices,
    telemetry,
    cleaningState,
    automation,
    triggerFeed,
    addActivity,
    addAlert,
  ]);

  // LIVE HARDWARE POLLING (Active when demoMode is disabled)
  useEffect(() => {
    if (demoMode) return;

    let isSubscribed = true;
    const syncHardware = async () => {
      try {
        const data = await fetchEspStatus(esp32Ip, 2500);
        if (!isSubscribed) return;

        setConnectionStatus('connected');
        setLastSyncSecondsAgo(0);

        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          temperature: Number(data.temperature.toFixed(1)),
          waterLevel: Number(data.waterLevel.toFixed(1)),
          tds: Math.round(data.tds),
          lightLevel: Math.round(data.lightLevel),
          timestamp: timeLabel,
          timeLabel,
        };
        setTelemetry(newPoint);
        setTelemetryHistory(prev => [...prev.slice(-25), newPoint]);

        setDevices(prev => ({
          ...prev,
          heater: { ...prev.heater, on: data.heater },
          airPump: { ...prev.airPump, on: data.airPump },
          light: { ...prev.light, on: data.light },
          fillPump: { ...prev.fillPump, on: data.fillPump },
          drainPump: { ...prev.drainPump, on: data.drainPump },
        }));

        if (data.feederDispensing !== undefined) {
          setFeeder(f => ({ ...f, isDispensing: data.feederDispensing ?? false }));
        }
      } catch {
        if (!isSubscribed) return;
        // If MQTT is connected or recent data was received within 10s, don't mark offline!
        const timeSinceData = Date.now() - lastDataReceivedTime.current;
        if (!mqttConnectedRef.current && timeSinceData > 10000) {
          setConnectionStatus('offline');
        }
      }
    };

    syncHardware();
    const pollInterval = setInterval(syncHardware, 2000);
    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [demoMode, esp32Ip]);

  // WORLDWIDE REAL-TIME CLOUD MQTT SYNC (Works on Mobile Data, 4G, 5G, Anywhere!)
  useEffect(() => {
    if (demoMode) return;

    const cleanup = initMqttSync(
      (data) => {
        lastDataReceivedTime.current = Date.now();
        setConnectionStatus('connected');
        setLastSyncSecondsAgo(0);

        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          temperature: Number(data.temperature.toFixed(1)),
          waterLevel: Number(data.waterLevel.toFixed(1)),
          tds: Math.round(data.tds),
          lightLevel: Math.round(data.lightLevel),
          timestamp: timeLabel,
          timeLabel,
        };
        setTelemetry(newPoint);
        setTelemetryHistory(prev => [...prev.slice(-25), newPoint]);

        setDevices(prev => ({
          ...prev,
          heater: { ...prev.heater, on: data.heater },
          airPump: { ...prev.airPump, on: data.airPump },
          light: { ...prev.light, on: data.light },
          fillPump: { ...prev.fillPump, on: data.fillPump },
          drainPump: { ...prev.drainPump, on: data.drainPump },
        }));

        if (data.feederDispensing !== undefined) {
          setFeeder(f => ({ ...f, isDispensing: data.feederDispensing ?? false }));
        }
      },
      (connected) => {
        mqttConnectedRef.current = connected;
        if (connected) {
          setConnectionStatus('connected');
        }
      }
    );

    return cleanup;
  }, [demoMode]);

  return (
    <AquavistaContext.Provider
      value={{
        activeTab,
        setActiveTab,
        esp32Ip,
        setEsp32Ip,
        telemetry,
        telemetryHistory,
        connectionStatus,
        setConnectionStatus,
        lastSyncSecondsAgo,
        devices,
        toggleDevice,
        setHeaterTarget,
        safetyNotice,
        clearSafetyNotice,
        cleaningState,
        startWaterChange,
        abortWaterChange,
        automation,
        updateAutomation,
        feeder,
        triggerFeed,
        updateFeederSettings,
        addFeedingSchedule,
        toggleFeedingSchedule,
        deleteFeedingSchedule,
        refillFoodHopper,
        feedEventTrigger,
        energy,
        toggleEnergySavingMode,
        alerts,
        markAlertRead,
        clearAlerts,
        activityLog,
        demoMode,
        setDemoMode,
      }}
    >
      {children}
    </AquavistaContext.Provider>
  );
};

export const useAquavista = () => {
  const context = useContext(AquavistaContext);
  if (!context) {
    throw new Error('useAquavista must be used within an AquavistaProvider');
  }
  return context;
};
