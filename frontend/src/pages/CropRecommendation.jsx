import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { 
  Sprout, 
  HelpCircle, 
  Droplet, 
  Thermometer, 
  CloudRain, 
  Compass, 
  FileDown, 
  RefreshCw,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function CropRecommendation() {
  const { addPrediction } = useApp();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    soil_type: 'Loamy',
    N: 50,
    P: 50,
    K: 50,
    temperature: 25.0,
    humidity: 60.0,
    rainfall: 100.0,
    pH: 6.5
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const soilTypes = ['Sandy', 'Clayey', 'Loamy', 'Silty', 'Peaty'];

  const handleSliderChange = (name, val) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(val)
    }));
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:5000/predict-crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();
      setResult(data);
      addPrediction(data);
      showToast(`Success! Recommended crop: ${data.predicted_crop}`, 'success');
    } catch (err) {
      console.error(err);
      // Fallback prediction mock for demo/offline use if backend fails to connect
      showToast('Backend offline. Displaying local demo calculation.', 'warning');
      
      // Local mockup generator based on input heuristics
      let mockCrop = 'Maize';
      let reason = 'balanced parameters';
      if (formData.rainfall > 180 && formData.humidity > 70) {
        mockCrop = 'Rice';
      } else if (formData.temperature < 20 && formData.rainfall < 60) {
        mockCrop = 'Chickpea';
      } else if (formData.K > 100 && formData.soil_type === 'Loamy') {
        mockCrop = 'Grapes';
      } else if (formData.N > 100 && formData.rainfall > 120) {
        mockCrop = 'Banana';
      } else if (formData.soil_type === 'Sandy' && formData.rainfall < 50) {
        mockCrop = 'Mothbeans';
      }

      const mockData = {
        type: "Crop Recommendation",
        predicted_crop: mockCrop,
        confidence: 89.4,
        soil_type: formData.soil_type,
        N: formData.N,
        P: formData.P,
        K: formData.K,
        temperature: formData.temperature,
        humidity: formData.humidity,
        rainfall: formData.rainfall,
        pH: formData.pH,
        details: {
          season: mockCrop === 'Rice' ? 'Kharif (Monsoon)' : mockCrop === 'Chickpea' ? 'Rabi (Winter)' : 'Kharif / Summer',
          water: mockCrop === 'Rice' ? 'High (~1200-1500 mm)' : 'Moderate (~400-600 mm)',
          fertilizer: mockCrop === 'Rice' ? 'Nitrogen-rich (NPK 120:60:40)' : 'Balanced (NPK 80:40:40)',
          description: `Locally inferred. ${mockCrop} is highly suitable for your inputs (Soil: ${formData.soil_type}, NPK: ${formData.N}-${formData.P}-${formData.K}).`
        }
      };

      setResult(mockData);
      addPrediction(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!result) return;
    
    try {
      const doc = new jsPDF();
      
      // Header theme colors
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("AGROVISION AI - REPORT", 14, 20);
      
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
      
      // Horizontal Line separator
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 45, 196, 45);
      
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Crop Recommendation Summary", 14, 55);
      
      // Predicted crop
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(24);
      doc.text(result.predicted_crop, 14, 68);
      
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text(`Confidence: ${result.confidence}%`, 14, 75);
      
      // Reset color
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Environmental & Soil Inputs Provided:", 14, 88);
      
      // Table values
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let y = 96;
      const dataRows = [
        ["Soil Type", result.soil_type],
        ["Nitrogen (N)", `${result.N} mg/kg`],
        ["Phosphorus (P)", `${result.P} mg/kg`],
        ["Potassium (K)", `${result.K} mg/kg`],
        ["Temperature", `${result.temperature} °C`],
        ["Humidity", `${result.humidity} %`],
        ["Rainfall", `${result.rainfall} mm`],
        ["pH Level", `${result.pH}`]
      ];
      
      dataRows.forEach(row => {
        doc.setFont("helvetica", "bold");
        doc.text(row[0], 16, y);
        doc.setFont("helvetica", "normal");
        doc.text(row[1], 80, y);
        doc.line(14, y + 2, 196, y + 2);
        y += 8;
      });
      
      // Crop cultivation details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Cultivation Guidelines:", 14, y + 10);
      
      doc.setFont("helvetica", "bold");
      doc.text("Suitable Season: ", 14, y + 20);
      doc.setFont("helvetica", "normal");
      doc.text(result.details.season, 52, y + 20);
      
      doc.setFont("helvetica", "bold");
      doc.text("Water Requirement: ", 14, y + 28);
      doc.setFont("helvetica", "normal");
      doc.text(result.details.water, 52, y + 28);
      
      doc.setFont("helvetica", "bold");
      doc.text("Fertilizer Recommendation: ", 14, y + 36);
      doc.setFont("helvetica", "normal");
      doc.text(result.details.fertilizer, 65, y + 36);
      
      // Description paragraph
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(result.details.description, 180);
      doc.text(splitDesc, 14, y + 48);
      
      // Footer signature
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Note: Generated locally by AgroVision AI Sandbox.", 14, 285);
      
      doc.save(`AgroVision_Report_${result.predicted_crop}.pdf`);
      showToast('PDF Report downloaded successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export PDF.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Crop Recommendation</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your soil metrics and environmental conditions to predict the most profitable and high-yielding crop.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" /> Soil & Atmospheric Inputs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Soil Type Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                Soil Type
                <span title="Select primary type of soil in your farm" className="cursor-help"><Info className="w-3.5 h-3.5 opacity-60" /></span>
              </label>
              <select
                name="soil_type"
                value={formData.soil_type}
                onChange={handleTextChange}
                className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-200"
              >
                {soilTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* pH Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Soil pH Value</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.pH.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="3.5"
                max="9.0"
                step="0.1"
                value={formData.pH}
                onChange={(e) => handleSliderChange('pH', e.target.value)}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>3.5 (Acidic)</span>
                <span>7.0 (Neutral)</span>
                <span>9.0 (Alkaline)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Chemical Nutrients (mg/kg)</h4>
            <div className="space-y-5">
              {/* Nitrogen (N) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">Nitrogen (N) <span title="Important for plant leaf canopy growth" className="cursor-help"><HelpCircle className="w-3 h-3 opacity-60" /></span></span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.N} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={formData.N}
                  onChange={(e) => handleSliderChange('N', e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Phosphorus (P) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">Phosphorus (P) <span title="Vital for root development and blooms" className="cursor-help"><HelpCircle className="w-3 h-3 opacity-60" /></span></span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.P} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  value={formData.P}
                  onChange={(e) => handleSliderChange('P', e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Potassium (K) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">Potassium (K) <span title="Enhances plant resilience and disease resistance" className="cursor-help"><HelpCircle className="w-3 h-3 opacity-60" /></span></span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.K} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={formData.K}
                  onChange={(e) => handleSliderChange('K', e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Climate Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Temperature</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.temperature.toFixed(1)} °C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="0.5"
                  value={formData.temperature}
                  onChange={(e) => handleSliderChange('temperature', e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Humidity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Humidity</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.humidity.toFixed(0)} %</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={formData.humidity}
                  onChange={(e) => handleSliderChange('humidity', e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Rainfall */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Rainfall</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.rainfall.toFixed(0)} mm</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={formData.rainfall}
                  onChange={(e) => handleSliderChange('rainfall', e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold hover:from-emerald-700 hover:to-teal-800 transition-all duration-200 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing Soil Chemistry...
              </>
            ) : (
              <>
                <Sprout className="w-5 h-5 animate-pulse-soft" />
                Run Recommendation Model
              </>
            )}
          </button>
        </form>

        {/* Prediction Output Container */}
        <div className="lg:col-span-5 space-y-6">
          {!result && !loading && (
            <div className="glass-card p-8 rounded-3xl text-center space-y-4 border-dashed border-2 border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-300 dark:text-slate-700 animate-pulse-soft">
                <Sprout className="w-16 h-16" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-700 dark:text-slate-300">Awaiting Farm Details</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Provide Nitrogen, Phosphorus, Potassium, Soil Type, and climate ranges to run the Random Forest predictor.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="glass-card p-8 rounded-3xl text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                  <Sprout className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">Running Random Forest</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Processing soil matrices against 22 distinct crop profiles...
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden space-y-6">
              {/* Green backdrop glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Title Header */}
              <div className="space-y-1 relative z-10">
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg text-xs">
                  Optimal Recommendation Result
                </span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white leading-tight pt-1">
                  {result.predicted_crop}
                </h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  Model Confidence: <span className="font-mono text-emerald-600 dark:text-emerald-400">{result.confidence}%</span>
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {result.details.description}
              </p>

              {/* Grid details cards */}
              <div className="grid grid-cols-1 gap-4">
                {/* Season Card */}
                <div className="flex items-start gap-3.5 p-4 bg-white/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl h-fit">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Optimal Cultivation Season</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{result.details.season}</p>
                  </div>
                </div>

                {/* Water Card */}
                <div className="flex items-start gap-3.5 p-4 bg-white/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-xl h-fit">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Water & Irrigation Volume</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{result.details.water}</p>
                  </div>
                </div>

                {/* Fertilizer Card */}
                <div className="flex items-start gap-3.5 p-4 bg-white/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl h-fit">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">NPK Fertilizer Suggestion</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{result.details.fertilizer}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleExportPDF}
                  className="flex-1 py-3.5 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-950 dark:hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 group"
                >
                  <FileDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                  Download PDF Report
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
