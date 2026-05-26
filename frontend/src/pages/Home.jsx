import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  ScanLine, 
  ArrowRight, 
  Leaf, 
  Activity, 
  BarChart3, 
  ShieldCheck,
  TrendingUp,
  FileDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function Home() {
  const { history, setActiveTab } = useApp();

  // Typical N-P-K levels for demo reference chart
  const standardCropNutrients = [
    { name: 'Rice', N: 100, P: 50, K: 40 },
    { name: 'Maize', N: 85, P: 50, K: 40 },
    { name: 'Cotton', N: 115, P: 45, K: 22 },
    { name: 'Banana', N: 110, P: 82, K: 130 },
    { name: 'Coffee', N: 102, P: 25, K: 32 },
    { name: 'Wheat', N: 80, P: 40, K: 30 }
  ];

  // Colors for charts
  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

  // Session Statistics Calculation
  const cropCount = history.filter(h => h.type === 'Crop Recommendation').length;
  const diseaseCount = history.filter(h => h.type === 'Disease Detection').length;
  
  const avgN = history.length > 0 && cropCount > 0
    ? Math.round(history.filter(h => h.type === 'Crop Recommendation').reduce((acc, curr) => acc + curr.N, 0) / cropCount)
    : 0;
  
  const avgP = history.length > 0 && cropCount > 0
    ? Math.round(history.filter(h => h.type === 'Crop Recommendation').reduce((acc, curr) => acc + curr.P, 0) / cropCount)
    : 0;

  const avgK = history.length > 0 && cropCount > 0
    ? Math.round(history.filter(h => h.type === 'Crop Recommendation').reduce((acc, curr) => acc + curr.K, 0) / cropCount)
    : 0;

  const historyPieData = [
    { name: 'Crops Recommended', value: cropCount || 0 },
    { name: 'Diseases Detected', value: diseaseCount || 0 }
  ].filter(item => item.value > 0);

  // If no history exists, use a default placeholder pie data
  const pieData = historyPieData.length > 0 
    ? historyPieData 
    : [
        { name: 'Crops Recommended (Sample)', value: 12 },
        { name: 'Diseases Detected (Sample)', value: 8 }
      ];

  const recentPredictions = history.slice(0, 3);

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-8 md:p-12 shadow-xl shadow-emerald-700/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 blur-sm pointer-events-none">
          <Sprout className="w-96 h-96" />
        </div>
        <div className="max-w-2xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/20 rounded-full text-xs font-semibold tracking-wide text-emerald-100 uppercase animate-pulse-soft">
            <Leaf className="w-3.5 h-3.5" /> Smart Agriculture Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Cultivate Success with <span className="text-emerald-300">AI-Powered</span> Agriculture
          </h1>
          <p className="text-emerald-100/80 text-sm md:text-base leading-relaxed">
            AgroVision AI uses machine learning to identify optimal crops for your soil chemistry and instantly analyze leaf uploads to diagnose plant patholgies.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => setActiveTab('crop')}
              className="px-6 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm shadow-md transition-all duration-200 hover:shadow-lg flex items-center gap-2 group"
            >
              Recommend Crop 
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <button 
              onClick={() => setActiveTab('disease')}
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-950 text-white font-bold text-sm shadow-md border border-emerald-500/20 transition-all duration-200 flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" /> Diagnose Leaves
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Predictions</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{history.length}</h3>
            <p className="text-[10px] text-slate-400">Current active session</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Activity className="w-6 h-6 animate-pulse-soft" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Crops Recommended</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{cropCount}</h3>
            <p className="text-[10px] text-slate-400">Soil analysis models</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Leaf className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Diseases Diagnosed</p>
            <h3 className="text-3xl font-extrabold text-rose-500 dark:text-rose-400">{diseaseCount}</h3>
            <p className="text-[10px] text-slate-400">Leaf image CNN models</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
            <ScanLine className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Soil N-P-K</p>
            <h3 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {avgN || '-'}/{avgP || '-'}/{avgK || '-'}
            </h3>
            <p className="text-[10px] text-slate-400">Nitrogen/Phosphorus/Potassium</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nutrients reference chart */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Optimal Crop Nutrient (N-P-K) Requisite Profile
            </h3>
            <p className="text-xs text-slate-500">Standard nitrogen, phosphorus, and potassium distribution values for common crops</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={standardCropNutrients}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} />
                <YAxis fontSize={11} stroke="#888888" tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px',
                    borderColor: 'rgba(16, 185, 129, 0.1)',
                    boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)'
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="N" fill="#10b981" radius={[4, 4, 0, 0]} name="Nitrogen (N)" />
                <Bar dataKey="P" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Phosphorus (P)" />
                <Bar dataKey="K" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Potassium (K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction distribution pie */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Prediction logs ratio
            </h3>
            <p className="text-xs text-slate-500">Analysis split between crop recommender and plant diseases</p>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{history.length}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Logs</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 px-2">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-40">{entry.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-300">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature cards segment */}
      <div className="space-y-4">
        <h3 className="font-bold text-xl text-slate-800 dark:text-white">Platform Core Capability</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="p-3 w-fit bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Leaf className="w-6 h-6 animate-pulse-soft" />
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-white">Soil Nutrition Mapping</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provides deep analysis of primary macro-nutrients (N, P, K), moisture levels, temperature margins, and soil acidity (pH) to recommend optimal crop viability.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="p-3 w-fit bg-rose-500/10 text-rose-500 rounded-xl">
              <ScanLine className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-white">Pathology Classification</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              A computer vision CNN models structure processing uploaded leaf snaps. Recognizes 10 conditions including late blight, virus attacks, rusts, or healthy leaves.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="p-3 w-fit bg-indigo-500/10 text-indigo-600 rounded-xl">
              <FileDown className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-white">Instant Exportable Reports</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Allows exporting details cards of recommended crop variables or leaf pathogen diagnoses into comprehensive PDF sheets for offline agricultural advisory use.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step segment */}
      <div className="glass-card p-8 rounded-3xl space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white">Diagnose and Plant Smartly</h3>
          <p className="text-xs text-slate-500">A quick guide to navigating AgroVision AI application modules</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">1</div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">Select Tool and Input</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Head to the Crop Recommendation page to fill soil metrics, or visit Disease Detection to drag-and-drop a leaf image.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">2</div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">ML Processing</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                The Flask application loads high-accuracy local files to generate recommendations and confidence parameters immediately.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">3</div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">Actionable Reports</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Read preventative actions, fertilizer details, or save your findings as an offline PDF report with a single tap.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© 2026 AgroVision AI. Local ML Inference Sandbox.</p>
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Secure local session data (In-memory storage)
        </p>
      </footer>
    </div>
  );
}
