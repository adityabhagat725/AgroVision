import React from 'react';
import { 
  Cpu, 
  Database, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  Code2,
  Workflow
} from 'lucide-react';

export default function About() {
  const stack = [
    {
      title: "Frontend Layer",
      icon: Code2,
      desc: "React 18 structured with Vite, utilizing Tailwind CSS v4 for native styling compiling, Lucide icons, and Recharts for animated responsive dashboards.",
      color: "text-sky-500 bg-sky-50 dark:bg-sky-950/30"
    },
    {
      title: "Backend Layer",
      icon: Cpu,
      desc: "Python Flask REST API with CORS headers serving inferences. Stores in-memory data arrays for current session analytics logs without requiring databases.",
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
    },
    {
      title: "Crop Engine (Random Forest)",
      icon: Database,
      desc: "A Scikit-learn Random Forest Classifier trained on synthetic multi-parameter agricultural ranges. Classifies 22 crops based on soil nutrients, pH, moisture, and temperature.",
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
    },
    {
      title: "Disease Engine (CNN)",
      icon: Layers,
      desc: "A PyTorch Convolutional Neural Network (CNN) trained to identify 10 leaf health classes across Tomato, Potato, Apple, and Corn plants with detailed prevention tips.",
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">About AgroVision AI</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Discover the technology, architectures, and capabilities powering this smart agricultural helper.
        </p>
      </div>

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stack.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card p-6 rounded-2xl flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className={`p-3 rounded-xl h-fit ${item.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Explanation */}
      <div className="glass-card p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Workflow className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl text-slate-800 dark:text-white">How the System Works</h3>
        </div>

        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
          {/* Step 1 */}
          <div className="relative">
            <span className="absolute -left-10 top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-md">1</span>
            <h4 className="font-semibold text-base text-slate-800 dark:text-white">Data Acquisition & Inputs</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
              Farmers input soil parameters (Nitrogen, Phosphorus, Potassium, pH) along with environment metrics (Temperature, Humidity, Rainfall) or upload images of infected crops.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <span className="absolute -left-10 top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-md">2</span>
            <h4 className="font-semibold text-base text-slate-800 dark:text-white">Inference Engines Processing</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
              The Flask backend receives requests. The Random Forest model outputs the highest probability crop, or the PyTorch CNN feeds leaf tensor vectors to determine disease classes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <span className="absolute -left-10 top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-md">3</span>
            <h4 className="font-semibold text-base text-slate-800 dark:text-white">Decision Support Analytics</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
              Results are parsed alongside curated databases. Detailed cards outline suitable seasons, irrigation ranges, fertilizer doses, and treatment plans for diseases, available for instant PDF downloads.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          Frequently Asked Questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 space-y-1.5">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Is there database storage?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No. In compliance with data requirements, history logs are stored in backend RAM during the current session only. Closing the terminal or refreshing resets the prediction logs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 space-y-1.5">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              What are the model data origins?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The crop model uses synthetic representations of famous agricultural datasets. The disease classification model utilizes a PyTorch CNN initialized on local leaf shape tensors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
