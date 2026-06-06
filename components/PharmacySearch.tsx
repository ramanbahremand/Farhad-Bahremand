import React, { useState } from 'react';
import { Language, PharmacyData } from '../types';
import { UI_TEXT } from '../constants';
import { analyzeDrug } from '../services/geminiService';
import { Search, Pill, Activity, AlertTriangle, Info, BookOpen, FlaskConical } from 'lucide-react';

interface PharmacySearchProps {
  language: Language;
}

const PharmacySearch: React.FC<PharmacySearchProps> = ({ language }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PharmacyData | null>(null);
  const [error, setError] = useState(false);

  const texts = UI_TEXT[language].pharmacy;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setError(false);

    try {
      const data = await analyzeDrug(query, language);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Search Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-blue-100 rounded-full mb-4 text-blue-600">
          <FlaskConical size={32} />
        </div>
        <h2 className="text-2xl font-bold text-blue-900 mb-2">{texts.title}</h2>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-10">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={texts.placeholder}
            className="w-full p-4 pr-14 md:pr-32 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 focus:ring focus:ring-emerald-200 shadow-sm text-lg transition-all outline-none text-gray-700"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute top-2 right-2 bottom-2 bg-emerald-600 text-white px-4 md:px-6 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <span>...</span>
            ) : (
              <>
                <Search size={20} />
                <span className="hidden md:inline">{texts.searchBtn}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
           <div className="inline-block animate-spin text-emerald-500 mb-3">
             <Activity size={32} />
           </div>
           <p className="text-emerald-600 font-medium">{texts.searching}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-red-500 py-8 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="mx-auto mb-2" />
          <p>Failed to analyze drug. Please try again.</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-500 p-6 text-white">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h3 className="text-2xl font-bold mb-1">{result.drug_name_en}</h3>
                   <p className="text-emerald-50 font-medium text-lg font-sans-arabic">{result.drug_name_local}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm border border-white/30">
                  {result.category}
                </div>
             </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Brand Names */}
            {result.brand_names && result.brand_names.length > 0 && (
               <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500 pb-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Common Brands:</span>
                  {result.brand_names.map((b, i) => (
                    <span key={i} className="bg-gray-100 px-2 py-1 rounded text-gray-600">{b}</span>
                  ))}
               </div>
            )}

            {/* Main Info Grid */}
            <div className="grid md:grid-cols-2 gap-8">
               
               {/* Uses */}
               <div className="space-y-3">
                  <h4 className="text-blue-800 font-bold flex items-center gap-2 text-lg">
                    <Activity size={20} /> {texts.labels.uses}
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-justify bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    {result.uses}
                  </p>
               </div>

               {/* Usage Instructions */}
               <div className="space-y-3">
                  <h4 className="text-emerald-800 font-bold flex items-center gap-2 text-lg">
                    <Pill size={20} /> {texts.labels.usage}
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-justify bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    {result.usage_instructions}
                  </p>
               </div>
            </div>
            
            {/* Mechanism (Full Width) */}
            <div className="space-y-3">
                <h4 className="text-purple-800 font-bold flex items-center gap-2 text-lg">
                   <FlaskConical size={20} /> {texts.labels.mechanism}
                </h4>
                <p className="text-gray-700 leading-relaxed text-justify">
                   {result.mechanism}
                </p>
            </div>

            {/* Side Effects & Warnings */}
            <div className="grid md:grid-cols-2 gap-6 pt-4">
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                   <h4 className="text-orange-800 font-bold flex items-center gap-2 mb-3">
                      <Info size={18} /> {texts.labels.sideEffects}
                   </h4>
                   <p className="text-sm text-orange-900 leading-6 text-justify">
                     {result.side_effects}
                   </p>
                </div>

                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                   <h4 className="text-red-800 font-bold flex items-center gap-2 mb-3">
                      <AlertTriangle size={18} /> {texts.labels.warnings}
                   </h4>
                   <p className="text-sm text-red-900 leading-6 text-justify">
                     {result.warnings}
                   </p>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacySearch;