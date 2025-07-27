import React from 'react';
import { ShoppingCart, Package, TrendingUp, LogOut, Store, UserPlus, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import UserRegistration from './UserRegistration';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { logout, userProfile } = useAuth();
  const [showUserRegistration, setShowUserRegistration] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const tabs = [
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart },
    { id: 'sales', label: 'Ventas', icon: TrendingUp },
    { id: 'reports', label: 'Reportes', icon: Store }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">La Gorda Bella Market</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{userProfile?.fullName}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userProfile?.role === 'admin' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userProfile?.role === 'admin' ? 'Admin' : 'Vendedor'}
                </span>
              </div>

              {/* Add User Button (only for admins) */}
              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => setShowUserRegistration(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                  title="Agregar Usuario"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="hidden sm:block">Agregar Usuario</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:block">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {/* User Registration Modal */}
      {showUserRegistration && (
        <UserRegistration
          onClose={() => setShowUserRegistration(false)}
          onSuccess={() => {
            // Optionally show success message or refresh user list
          }}
        />
      )}
    </div>
  );
};

export default Layout;