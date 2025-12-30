// src/components/layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, Package, Menu, X, Activity, UserCog, Snowflake, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin'] },
    { name: 'Users', href: '/users', icon: UserCog, roles: ['admin'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['admin'] },
    { name: 'Jobs', href: '/jobs', icon: Briefcase, roles: ['admin'] },
    { name: 'Dashboard', href: '/technician/dashboard', icon: Home, roles: ['technician'] },
    { name: 'Jobs', href: '/technician/jobs', icon: Activity, roles: ['technician'] },
    { name: 'Inventory', href: '/inventory', icon: Package, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role)
  );

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 bg-gray-900 text-white z-50 w-64 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800 justify-between">
          <div className="flex items-center gap-2 w-full justify-start lg:justify-center">
            <Snowflake className="w-7 h-7 text-blue-300" />
            <span className="font-bold text-lg">CoolTrack</span>
          </div>

          {/* Close button only for mobile and tablet */}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={toggleSidebar} // Close sidebar on click (mobile and tablet only)
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 hidden lg:block">
          <p className="text-xs text-gray-400 text-center">RAC Management v1.0</p>
        </div>
      </aside>

      {/* Overlay for mobile and tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;