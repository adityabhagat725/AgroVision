import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import CropRecommendation from './pages/CropRecommendation'
import DiseaseDetection from './pages/DiseaseDetection'
import About from './pages/About'

function MainLayout() {
  const { activeTab } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'crop':
        return <CropRecommendation />
      case 'disease':
        return <DiseaseDetection />
      case 'about':
        return <About />
      case 'home':
      default:
        return <Home />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:h-screen lg:overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderActivePage()}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ToastProvider>
  )
}
