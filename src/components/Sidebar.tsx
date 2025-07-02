
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Plus, 
  Calendar, 
  Settings, 
  Bell,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole: 'admin' | 'sales_manager' | 'sales_associate';
}

const Sidebar = ({ isOpen, onToggle, userRole }: SidebarProps) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Users, roles: ['admin', 'sales_manager', 'sales_associate'] },
    { name: 'Leads', href: '/leads', icon: Search, roles: ['admin', 'sales_manager', 'sales_associate'] },
    { name: 'Add Lead', href: '/add-lead', icon: Plus, roles: ['admin', 'sales_manager', 'sales_associate'] },
    { name: 'Assign Leads', href: '/assign-leads', icon: Users, roles: ['admin', 'sales_manager'] },
    { name: 'Team', href: '/team', icon: Users, roles: ['admin', 'sales_manager'] },
    { name: 'Reminders', href: '/reminders', icon: Calendar, roles: ['admin', 'sales_manager', 'sales_associate'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'sales_manager', 'sales_associate'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <>
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-gray-900 border-r border-gray-800 transition-all duration-300",
          isOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
            {isOpen && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-white">LeadCRM</span>
              </div>
            )}
            {!isOpen && (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <Users className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="ml-3">{item.name}</span>}
                  {!isOpen && (
                    <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Role Badge */}
          {isOpen && (
            <div className="p-4 border-t border-gray-800">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Role</p>
                <p className="text-sm font-medium text-white capitalize">
                  {userRole.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={onToggle}
        size="sm"
        variant="outline"
        className={cn(
          "fixed top-4 z-50 bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300",
          isOpen ? "left-60" : "left-12"
        )}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>
    </>
  );
};

export default Sidebar;
