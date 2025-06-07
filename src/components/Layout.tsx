import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, List, Settings, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: BarChart2, label: 'Dashboard', path: '/' },
    { icon: List, label: 'Call Lists', path: '/call-lists' },
    { icon: Phone, label: 'Call Session', path: '/call-session' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto border-r-2 bg-blue-100">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Phone className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-900">AutoDialer</h1>
          </div>
          <div className="flex flex-col flex-grow">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md group w-full transition-colors ${
                    window.location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 border-[1.5px] border-blue-500 border-l-8'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      window.location.pathname === item.path
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-blue-600'
                    }`}
                  />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <button
                  onClick={logout}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors border border-gray-500 px-3 py-1 rounded-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b w-full">
        <div className="flex items-center">
          <Phone className="h-6 w-6 text-blue-600" />
          <h1 className="ml-2 text-lg font-bold text-gray-900">AutoDialer</h1>
        </div>
        <div className="block">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">Open menu</span>
            <svg
              className="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;