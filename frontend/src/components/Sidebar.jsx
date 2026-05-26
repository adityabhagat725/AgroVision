import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Sprout, 
  ScanLine, 
  Info, 
  Sun, 
  Moon, 
  Menu, 
  X,
  History,
  Trash2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function Sidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    darkMode, 
    toggleDarkMode, 
    history, 
    clearHistory 
  } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Dashboard Home', icon: Home },
    { id: 'crop', label: 'Crop Recommendation', icon: Sprout },
    { id: 'disease', label: 'Plant Disease Detection', icon: ScanLine },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  const getHistoryBadgeColor = (type) => {
    return type === 'Crop Recommendation' 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-emerald-700 text-white shadow-md z-40 relative">
        <div className="flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-300 animate-pulse-soft" />
          <span className="font-bold tracking-wide text-lg">AgroVision AI</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 transition-colors focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 glass-nav text-slate-800 dark:text-slate-100 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
              <Sprout className="w-6 h-6 animate-pulse-soft" />
            </div>
            <div>
              <h1 className="font-extrabold tracking-wide text-lg text-emerald-700 dark:text-emerald-400">AgroVision AI</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Agricultural ML Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">Navigation</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}

          {/* Session History Feed Widget */}
          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-6">
            <div className="flex items-center justify-between px-3 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Session History</span>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  title="Clear history"
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-6 px-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200/55 dark:border-slate-800/55">
                <TrendingUp className="w-5 h-5 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">No predictions recorded in this session yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.slice(0, 5).map((pred, i) => (
                  <button
                    key={i}
                    onClick={() => handleTabClick(pred.type === 'Crop Recommendation' ? 'crop' : 'disease')}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all flex flex-col gap-1 text-[11px]"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`px-1.5 py-0.5 rounded font-semibold scale-90 origin-left ${getHistoryBadgeColor(pred.type)}`}>
                        {pred.type === 'Crop Recommendation' ? 'Crop' : 'Disease'}
                      </span>
                      <span className="text-slate-400 font-mono text-[9px]">{pred.confidence}%</span>
                    </div>
                    <span className="font-bold truncate text-slate-700 dark:text-slate-300">
                      {pred.type === 'Crop Recommendation' ? pred.predicted_crop : pred.disease_name.split(' - ')[1] || pred.disease_name}
                    </span>
                  </button>
                ))}
                {history.length > 5 && (
                  <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                    + {history.length - 5} more predictions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Area with Theme Toggle */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </div>
            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-emerald-600' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
}
