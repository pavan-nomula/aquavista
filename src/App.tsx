import React, { useState } from 'react';
import { AquavistaProvider, useAquavista } from './context/AquavistaContext';
import { BootSplash } from './components/BootSplash';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SafetyInterlockBanner } from './components/SafetyInterlockBanner';
import { SecurityPinModal } from './components/SecurityPinModal';
import { OverviewView } from './views/OverviewView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { WaterManagementView } from './views/WaterManagementView';
import { DeviceControlView } from './views/DeviceControlView';
import { SchedulesView } from './views/SchedulesView';
import { EnergyView } from './views/EnergyView';
import { AlertsView } from './views/AlertsView';
import { SettingsView } from './views/SettingsView';

const DashboardContent: React.FC = () => {
  const { activeTab } = useAquavista();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'monitoring':
        return <LiveMonitoringView />;
      case 'water':
        return <WaterManagementView />;
      case 'devices':
        return <DeviceControlView />;
      case 'schedules':
        return <SchedulesView />;
      case 'energy':
        return <EnergyView />;
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Command Bar */}
      <Header />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1500px] mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto max-w-full">
          <SafetyInterlockBanner />
          {renderActiveView()}
        </main>
      </div>

      {/* Security Passcode Modal for Actuator Operations */}
      <SecurityPinModal />
    </div>
  );
};

export function App() {
  const [bootDone, setBootDone] = useState(false);

  return (
    <AquavistaProvider>
      {!bootDone && <BootSplash onComplete={() => setBootDone(true)} />}
      <DashboardContent />
    </AquavistaProvider>
  );
}

export default App;
