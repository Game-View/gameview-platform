import { AppSidebar, defaultNavItems, Toaster } from '@gameview/ui';
import { useState } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProductionView } from './components/ProductionView';
import { NewProductionDialog } from './components/NewProductionDialog';
import { useAppStore } from './store/appStore';

export function App() {
  const { currentProduction } = useAppStore();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showNewProductionDialog, setShowNewProductionDialog] = useState(false);

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    // Handle navigation based on id
    if (id === 'productions' && !currentProduction) {
      setShowNewProductionDialog(true);
    }
  };

  return (
    <div className="flex h-screen bg-gv-neutral-900">
      {/* Sidebar */}
      <AppSidebar
        items={defaultNavItems}
        activeId={activeNav}
        onItemClick={handleNavClick}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        logo={
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐰</span>
            <span className="text-lg font-bold text-white">Game View</span>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNewProduction={() => setShowNewProductionDialog(true)} />
        <main className="flex-1 overflow-auto">
          {currentProduction ? (
            <ProductionView />
          ) : (
            <WelcomeScreen onNewProduction={() => setShowNewProductionDialog(true)} />
          )}
        </main>
      </div>

      {/* New Production Dialog */}
      <NewProductionDialog
        open={showNewProductionDialog}
        onOpenChange={setShowNewProductionDialog}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
