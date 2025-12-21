import React from 'react';
import { Layout } from './components/Layout';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProductionView } from './components/ProductionView';
import { useAppStore } from './store/appStore';

export function App() {
  const { currentProduction } = useAppStore();

  return (
    <Layout>
      {currentProduction ? <ProductionView /> : <WelcomeScreen />}
    </Layout>
  );
}
