import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Inventory from './components/Inventory';
import Purchases from './components/Purchases';
import Sales from './components/Sales';
import Reports from './components/Reports';

function App() {
  const { user, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Login />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        );
      case 'purchases':
        return (
          <ProtectedRoute requiredRole="admin">
            <Purchases />
          </ProtectedRoute>
        );
      case 'sales':
        return (
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute requiredRole="admin">
            <Reports />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        );
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveTab()}
    </Layout>
  );
}

export default App;