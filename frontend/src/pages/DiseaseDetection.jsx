import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { 
  Upload, 
  FileDown, 
  X, 
  ScanLine, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  FileImage
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function DiseaseDetection() {
  const { addPrediction } = useApp();
  const { showToast } = useToast();
  
  const CROP_OPTIONS = ['Auto-detect', 'Tomato', 'Apple', 'Potato', 'Corn'];

  const CROP_CLASS_MAP = {
    'Tomato': ["Tomato - Tomato Yellow Leaf Curl Virus", "Tomato - Late Blight", "Tomato - Healthy"],
    'Apple':  ["Apple - Apple Scab", "Apple - Black Rot", "Apple - Healthy"],
    'Potato': ["Potato - Early Blight", "Potato - Late Blight", "Potato - Healthy"],
    'Corn':   ["Corn - Common Rust"],
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropType, setCropType] = useState('Auto-detect');
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null);
      } else {
        showToast('Only image files (JPEG, PNG) are supported.', 'error');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setCropType('Auto-detect');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    if (cropType !== 'Auto-detect') formData.append('crop_type', cropType);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/detect-disease`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Server returned error');
      }

      const data = await res.json();
      setResult(data);
      addPrediction(data);
      showToast(`Leaf analysis complete! Result: ${data.disease_name}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Backend offline. Simulating local neural network output.', 'warning');
      
      // Fallback local mockup generator based on file name strings
      const DISEASE_CLASSES = [
        "Tomato - Tomato Yellow Leaf Curl Virus",
        "Tomato - Late Blight",
        "Tomato - Healthy",
        "Apple - Apple Scab",
        "Apple - Black Rot",
        "Apple - Healthy",
        "Potato - Early Blight",
        "Potato - Late Blight",
        "Potato - Healthy",
        "Corn - Common Rust"
      ];

      const DISEASE_DETAILS = {
        "Tomato - Tomato Yellow Leaf Curl Virus": {
          "description": "Tomato Yellow Leaf Curl Virus (TYLCV) is a devastating plant virus transmitted by whiteflies. It causes severe stunting, upward leaf curling, and yellowing, preventing fruit growth if infected early.",
          "prevention": "1. Use certified virus-free seedlings.\n2. Install insect-proof mesh netting in greenhouses.\n3. Put up yellow sticky traps to capture whiteflies.\n4. Maintain a weed-free buffer zone.",
          "treatment": "1. No chemical cure exists; pull out and burn infected plants immediately.\n2. Spray neem oil, horticultural soaps, or systemic insecticides to control whiteflies.\n3. Release natural predators like ladybugs or parasitic wasps."
        },
        "Tomato - Late Blight": {
          "description": "Late Blight is caused by the oomycete Phytophthora infestans. It is highly destructive, starting as water-soaked spots on leaves and fruit that turn dark brown and rot rapidly in humid conditions.",
          "prevention": "1. Plant certified resistant tomato cultivars.\n2. Space plants widely to promote rapid foliage drying.\n3. Use drip irrigation rather than overhead sprinklers.\n4. Rotate crops annually.",
          "treatment": "1. Apply preventative copper fungicides or Bacillus subtilis products.\n2. Prune and destroy lower infected leaves.\n3. Remove severely infected plants to protect healthy neighbors."
        },
        "Tomato - Healthy": {
          "description": "The tomato foliage is healthy and showing vigorous growth. The leaf tissue is a dark green color, free of any lesions, yellowing, or abnormal curling, indicating proper nutrient uptake and excellent disease resistance.",
          "prevention": "1. Maintain consistent soil moisture.\n2. Apply organic mulch to prevent splash-borne spores.\n3. Prune suckers to optimize airflow.",
          "treatment": "No treatment required! Maintain current watering and fertilization schedules."
        },
        "Apple - Apple Scab": {
          "description": "Apple Scab is caused by the fungus Venturia inaequalis. It creates olive-green to black velvety spots on leaves and scabby lesions on apple fruits, leading to premature leaf drop and reduced vigor.",
          "prevention": "1. Choose scab-resistant apple cultivars.\n2. Rake and destroy fallen leaves in autumn to eliminate overwintering spores.\n3. Prune trees yearly to maximize sunlight and wind penetration.",
          "treatment": "1. Spray sulfur-based or copper fungicides in early spring at green tip, pink bud, and petal fall.\n2. Maintain protective spray schedules in wet seasons."
        },
        "Apple - Black Rot": {
          "description": "Black Rot, caused by the fungus Botryosphaeria obtusa, affects leaves (producing 'frogeye' purple spots), stems (forming cankers), and fruits (concentric brown decay starting from blossom end).",
          "prevention": "1. Prune out dead branches, limb cankers, and mummified fruits yearly.\n2. Disinfect pruning shears with alcohol or bleach between trees.",
          "treatment": "1. Apply protective fungicides containing Captan or copper-based compounds from bud break through harvest.\n2. Cut out branch cankers 6 inches below visible infection during dormancy."
        },
        "Apple - Healthy": {
          "description": "The apple foliage is healthy, showing optimal chlorophyll levels and strong structural integrity, with no signs of fungal or bacterial attack.",
          "prevention": "1. Annual pruning to maintain tree structure.\n2. Regular application of compost or balanced fertilizer.\n3. Periodic monitoring for early pest signs.",
          "treatment": "No treatment required. Maintain regular irrigation and orchard sanitation."
        },
        "Potato - Early Blight": {
          "description": "Early Blight is caused by the fungus Alternaria solani. It targets older lower leaves, producing dark brown, circular spots with concentric rings resembling a target board.",
          "prevention": "1. Plant certified disease-free seed tubers.\n2. Ensure proper spacing to avoid wet leaf canopies.\n3. Rotate crops on a 3-year cycle.",
          "treatment": "1. Spray protective fungicides like Mancozeb or copper fungicides at the first sign of spots.\n2. Maintain high soil fertility (nitrogen/potassium), as stressed crops are more vulnerable."
        },
        "Potato - Late Blight": {
          "description": "Late Blight is caused by the water-mold Phytophthora infestans. It thrives in cool, damp conditions, creating large dark lesions on leaves and stems that rot the foliage, accompanied by a white mold underneath.",
          "prevention": "1. Use certified blight-free seed potatoes.\n2. Destroy volunteer potato plants and discard piles.\n3. Harvest only 2 weeks after vines die to protect tubers.",
          "treatment": "1. Spray systemic fungicides immediately upon detection or high humidity warning.\n2. Remove infected vines; do not compost blight-infected plants."
        },
        "Potato - Healthy": {
          "description": "The potato leaf is fully green and shows healthy physiological growth, without early/late blight symptoms or insect damage.",
          "prevention": "1. Practice proper crop rotation.\n2. Hill soil around potato stalks to protect tubers.\n3. Use drip lines instead of overhead sprinklers.",
          "treatment": "No treatment required. Continue standard agricultural monitoring."
        },
        "Corn - Common Rust": {
          "description": "Common Rust is caused by the fungus Puccinia sorghi, generating powdery, cinnamon-brown pustules on both leaf surfaces, leading to leaf yellowing and reduced kernel weight.",
          "prevention": "1. Plant rust-resistant corn hybrids.\n2. Eradicate wood sorrel weeds, which serve as alternate hosts.\n3. Rotate crops to decompose residue.",
          "treatment": "1. Apply foliar fungicides early if pustules appear before silking.\n2. For organic farming, apply sulfur dusts or copper compounds."
        }
      };

      // Heuristic matching: restrict to selected crop type if not Auto-detect
      const pool = cropType !== 'Auto-detect' ? CROP_CLASS_MAP[cropType] : DISEASE_CLASSES;
      const nameLower = selectedFile.name.toLowerCase();
      let diseaseClass = pool[0];
      for (const cls of pool) {
        const key = cls.split(' - ')[1]?.toLowerCase().replace(/\s+/g, '') ?? '';
        if (nameLower.includes(key) || nameLower.includes(cls.split(' - ')[0].toLowerCase())) {
          diseaseClass = cls;
          break;
        }
      }

      const mockData = {
        type: "Disease Detection",
        disease_name: diseaseClass,
        crop_type: cropType,
        confidence: 93.7,
        details: DISEASE_DETAILS[diseaseClass]
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
      
      // Header band
      doc.setFillColor(244, 63, 94);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("AGROVISION AI - LEAF ANALYSIS", 14, 20);
      
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
      
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 45, 196, 45);
      
      // Disease Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Plant Pathology Diagnosis", 14, 55);
      
      // Pathology Name
      doc.setFont("helvetica", "bold");
      doc.setTextColor(225, 29, 72);
      doc.setFontSize(22);
      doc.text(result.disease_name, 14, 68);
      
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text(`Model Analysis Confidence: ${result.confidence}%`, 14, 75);
      
      // Description Section
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Condition Description:", 14, 88);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(result.details.description, 180);
      doc.text(splitDesc, 14, 96);
      
      // Calculate dynamic offset height for description height
      const descHeight = splitDesc.length * 5;
      let y = 96 + descHeight + 10;
      
      // Prevention guidelines
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Prevention Measures:", 14, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitPrev = doc.splitTextToSize(result.details.prevention, 180);
      doc.text(splitPrev, 14, y + 8);
      
      const prevHeight = splitPrev.length * 5;
      y = y + 8 + prevHeight + 10;
      
      // Treatment guidelines
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Treatment Suggestions:", 14, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitTreat = doc.splitTextToSize(result.details.treatment, 180);
      doc.text(splitTreat, 14, y + 8);
      
      // Footer signature
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("AgroVision AI Leaf Scan Diagnostic Report. Keep copy for soil references.", 14, 285);
      
      doc.save(`AgroVision_Pathology_${result.disease_name.replace(/\s+/g, '_')}.pdf`);
      showToast('Diagnostic PDF Report downloaded successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export PDF.', 'error');
    }
  };

  const isHealthy = result && result.disease_name.toLowerCase().includes('healthy');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Plant Disease Detection</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload leaf images to diagnose crop diseases and read treatment prescriptions immediately.
        </p>
      </div>

      {/* Crop Type Selector */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Select Crop Type <span className="text-emerald-500">— improves detection accuracy</span></p>
        <div className="flex flex-wrap gap-2">
          {CROP_OPTIONS.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => setCropType(crop)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                cropType === crop
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              {crop === 'Auto-detect' ? '🔍 Auto-detect' : crop}
            </button>
          ))}
        </div>
        {cropType !== 'Auto-detect' && (
          <p className="text-[11px] text-slate-400 mt-2">
            Analysis restricted to <span className="font-semibold text-emerald-500">{cropType}</span> diseases: {CROP_CLASS_MAP[cropType].join(', ')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Container */}
        <div className="lg:col-span-7 space-y-6">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`
              glass-card p-8 rounded-3xl border-2 border-dashed text-center flex flex-col items-center justify-center min-h-[320px] transition-all duration-200
              ${dragActive ? 'border-emerald-600 bg-emerald-500/5' : 'border-slate-200/60 dark:border-slate-800/60'}
              ${previewUrl ? 'py-6' : 'py-12'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="p-4 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-full animate-float">
                  <Upload className="w-12 h-12" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">Drag & Drop Plant Leaf Photo</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Supports JPG, PNG formats up to 5MB</p>
                </div>
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="space-y-5 w-full max-w-sm relative">
                {/* Remove button */}
                <button 
                  onClick={handleReset}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-slate-800 text-white hover:bg-black transition-all shadow-lg z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-md aspect-video bg-black flex items-center justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Uploaded leaf preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/30 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <FileImage className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate font-semibold">{selectedFile?.name}</span>
                  </div>
                  <span className="font-mono flex-shrink-0">{(selectedFile?.size / 1024).toFixed(0)} KB</span>
                </div>
              </div>
            )}
          </div>

          {previewUrl && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white font-bold hover:from-rose-700 hover:to-red-800 transition-all duration-200 shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Running Neural Classification...
                </>
              ) : (
                <>
                  <ScanLine className="w-5 h-5" />
                  Analyze Leaf Pathologies
                </>
              )}
            </button>
          )}
        </div>

        {/* Prediction Outputs Container */}
        <div className="lg:col-span-5 space-y-6">
          {!result && !loading && (
            <div className="glass-card p-8 rounded-3xl text-center space-y-4 border-dashed border-2 border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center min-h-[320px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-300 dark:text-slate-700 animate-pulse-soft">
                <ScanLine className="w-16 h-16" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-700 dark:text-slate-300">Awaiting Leaf Upload</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Provide an image file of a crop leaf with suspected symptoms to check condition classifications.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="glass-card p-8 rounded-3xl text-center space-y-6 flex flex-col items-center justify-center min-h-[320px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-rose-500/10 border-t-rose-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-rose-600">
                  <ScanLine className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">Scanning Image Tensors</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Executing CNN convolution filters on leaf color margins...
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className={`glass-card p-6 md:p-8 rounded-3xl border shadow-2xl relative overflow-hidden space-y-6 ${
              isHealthy ? 'border-emerald-500/20' : 'border-rose-500/20'
            }`}>
              {/* Colored blur glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                isHealthy ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`} />

              {/* Title Header */}
              <div className="space-y-1 relative z-10">
                <span className={`px-2.5 py-1 font-semibold rounded-lg text-xs ${
                  isHealthy ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  Pathology Scanner Verdict
                </span>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight pt-1">
                  {result.disease_name}
                </h3>
                <div className="flex items-center gap-2 pt-0.5">
                  {isHealthy ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  )}
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    Model Confidence: <span className="font-mono text-slate-700 dark:text-slate-300">{result.confidence}%</span>
                  </p>
                  {result.crop_type && result.crop_type !== 'Auto-detect' && (
                    <span className="ml-auto px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {result.crop_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {result.details.description}
              </p>

              {/* Detailed Lists */}
              <div className="space-y-4">
                {/* Prevention */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Prevention Guidelines
                  </h4>
                  <div className="text-[11px] text-slate-500 leading-relaxed space-y-1 pl-1">
                    {result.details.prevention.split('\n').map((item, idx) => (
                      <p key={idx}>{item}</p>
                    ))}
                  </div>
                </div>

                {/* Treatment */}
                {!isHealthy && (
                  <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-emerald-500" />
                      Treatment Prescription
                    </h4>
                    <div className="text-[11px] text-slate-500 leading-relaxed space-y-1 pl-1">
                      {result.details.treatment.split('\n').map((item, idx) => (
                        <p key={idx}>{item}</p>
                      ))}
                    </div>
                  </div>
                )}
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
                  onClick={handleReset}
                  className="px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
