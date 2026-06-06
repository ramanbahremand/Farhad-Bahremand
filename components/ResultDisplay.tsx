import React, { useState } from 'react';
import { AnalysisResult, DocType, Language, PrescriptionItem, TranslatedItem } from '../types';
import { UI_TEXT } from '../constants';
import { AlertTriangle, FileText, Pill, Activity, Languages, Image as ImageIcon, Stethoscope, FileSearch, QrCode, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultDisplayProps {
  result: AnalysisResult;
  language: Language;
  originalImageSrc: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, language, originalImageSrc }) => {
  const [activeTab, setActiveTab] = useState<'extracted' | 'translated' | 'original' | 'summary'>('translated');
  const texts = UI_TEXT[language];

  // Helper to determine document types
  const isPrescription = result.docType === DocType.PRESCRIPTION;
  const isQrCode = result.docType === DocType.QR_CODE;

  const renderPrescriptionTable = () => {
    if (!result.structuredData || !('items' in result.structuredData)) return null;
    const items = result.structuredData.items;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Medication</th>
              <th className="px-6 py-3">Dose</th>
              <th className="px-6 py-3">Freq</th>
              <th className="px-6 py-3">Route</th>
              <th className="px-6 py-3">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: PrescriptionItem, idx: number) => (
              <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.drugnamesource}
                  {item.normalized_name && <div className="text-xs text-gray-400">({item.normalized_name})</div>}
                </td>
                <td className="px-6 py-4">{item.dose_value ? `${item.dose_value} ${item.dose_unit || ''}` : '-'}</td>
                <td className="px-6 py-4">{item.frequency || '-'}</td>
                <td className="px-6 py-4">{item.route || '-'}</td>
                <td className="px-6 py-4 text-amber-600">
                  {item.warnings && item.warnings.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {item.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.structuredData.notes && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            <strong>Notes:</strong> {result.structuredData.notes}
          </div>
        )}
      </div>
    );
  };

  const renderTranslatedPrescription = () => {
    if (!result.translation.items_translated) return <p className="text-gray-500 italic">No structured translation available.</p>;
    
    return (
      <div className="space-y-4">
        {result.translation.items_translated.map((item: TranslatedItem, idx: number) => (
          <div key={idx} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                <Pill size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">{item.drug_display}</h4>
                <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                  {item.dose_display && <span className="bg-gray-100 px-2 py-0.5 rounded">{item.dose_display}</span>}
                  {item.route_display && <span className="bg-gray-100 px-2 py-0.5 rounded">{item.route_display}</span>}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right rtl:text-left">
               <div className="font-medium text-emerald-700">{item.frequency_display}</div>
               <div className="text-sm text-gray-500">{item.duration_display}</div>
            </div>
          </div>
        ))}
         {result.translation.notes_translated && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800 border-l-4 border-blue-400">
            {result.translation.notes_translated}
          </div>
        )}
      </div>
    );
  };

  const renderQrCodeResult = () => {
    const data = result.structuredData as any;
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-md flex items-start gap-4">
          <div className="bg-white/10 p-3 rounded-lg">
            <QrCode size={32} />
          </div>
          <div className="break-all">
            <h3 className="text-gray-400 text-sm uppercase font-bold mb-1">Decoded Data</h3>
            <p className="font-mono text-lg">{data.qr_data || data.raw_text}</p>
            {data.qr_data && (data.qr_data.startsWith('http') || data.qr_data.startsWith('www')) && (
               <a href={data.qr_data} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-emerald-400 hover:text-emerald-300 underline">
                 <LinkIcon size={16} /> Open Link
               </a>
            )}
          </div>
        </div>

        {data.qr_context && (
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
             <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
               <Activity size={18} /> Context
             </h3>
             <p className="text-blue-800">{data.qr_context}</p>
          </div>
        )}
      </div>
    );
  }

  const renderReportSummary = () => {
     if (isPrescription) return null;
     if (isQrCode) return renderQrCodeResult();
     
     // Type assertion since we checked !isPrescription
     const data = result.structuredData as any; 
     
     // Fallback for general text
     if(result.docType === DocType.GENERAL_TEXT && 'raw_text' in (result.structuredData || {})) {
        return (
             <div className="prose prose-sm max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-2">Extracted Text</h3>
                <p>{(result.structuredData as any).raw_text}</p>
            </div>
        )
     }

     if (!data || !('key_findings' in data)) return null;

     return (
       <div className="space-y-6">
         
         {/* Specialist Analysis (Source Language) */}
         {data.specialist_analysis && (
            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 px-3 py-1 rounded-bl-lg text-xs font-bold uppercase tracking-wide">
                  Doctor's Note
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Stethoscope size={22} className="text-blue-600" /> Professional Medical Analysis
                </h3>
                <p className="text-blue-900 leading-7 text-sm text-justify font-medium">
                    {data.specialist_analysis}
                </p>
            </div>
         )}

         <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 text-emerald-700 flex items-center gap-2">
                 <Activity size={18}/> Key Findings
              </h3>
              <ul className="space-y-2">
                {data.key_findings.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-1">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            
             {data.uncertainties && data.uncertainties.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                     <AlertTriangle size={16} /> Uncertainties
                  </h3>
                  <ul className="space-y-2">
                    {data.uncertainties.map((u: string, i: number) => (
                      <li key={i} className="text-sm text-amber-900 opacity-90">{u}</li>
                    ))}
                  </ul>
                </div>
             )}
         </div>
       </div>
     );
  };

  const renderTranslatedReport = () => {
    if (isQrCode) return renderQrCodeResult();

    // If general text translation
    if (result.translation.translated_text) {
        return (
            <div className="prose prose-blue max-w-none">
              <ReactMarkdown>{result.translation.translated_text || ''}</ReactMarkdown>
            </div>
          );
    }

    // If structured report translation
    return (
        <div className="space-y-6">
            {/* Specialist Analysis (Translated) */}
            {result.translation.specialist_analysis_translated && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl shadow-sm ring-1 ring-blue-100">
                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Stethoscope size={24} className="text-blue-700" /> {texts.sections.specialistAnalysis}
                    </h3>
                    <p className="text-blue-950 leading-8 text-justify font-medium">
                        {result.translation.specialist_analysis_translated}
                    </p>
                </div>
            )}

            {/* Patient Summary (Translated) */}
            {result.translation.lay_summary_translated && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <Activity size={22} /> {texts.sections.patientSummary}
                    </h3>
                    <p className="text-emerald-900 leading-relaxed">
                        {result.translation.lay_summary_translated}
                    </p>
                </div>
            )}
            
            {!result.translation.specialist_analysis_translated && !result.translation.lay_summary_translated && (
                <div className="text-center py-10 text-gray-500">
                    Translation in progress or data not structured.
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isQrCode ? <QrCode /> : <FileText />}
          <span className="font-semibold capitalize">{result.docType.replace(/_/g, ' ')}</span>
        </div>
        <div className="text-xs bg-blue-700 px-2 py-1 rounded shadow-sm">
          {language.toUpperCase()} Output
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        <button 
          onClick={() => setActiveTab('translated')}
          className={`flex-1 py-4 px-6 font-medium text-sm whitespace-nowrap transition-colors flex justify-center items-center gap-2
            ${activeTab === 'translated' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Languages size={18} /> {texts.tabs.translated}
        </button>
        <button 
          onClick={() => setActiveTab('extracted')}
          className={`flex-1 py-4 px-6 font-medium text-sm whitespace-nowrap transition-colors flex justify-center items-center gap-2
            ${activeTab === 'extracted' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FileSearch size={18} /> {isPrescription ? 'Structured Data' : (isQrCode ? 'QR Data' : 'Source Analysis')}
        </button>
        {!isPrescription && !isQrCode && (
             <button 
             onClick={() => setActiveTab('summary')}
             className={`flex-1 py-4 px-6 font-medium text-sm whitespace-nowrap transition-colors flex justify-center items-center gap-2
               ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <Activity size={18} /> {texts.tabs.summary}
           </button>
        )}
        <button 
          onClick={() => setActiveTab('original')}
          className={`flex-1 py-4 px-6 font-medium text-sm whitespace-nowrap transition-colors flex justify-center items-center gap-2
            ${activeTab === 'original' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ImageIcon size={18} /> {texts.tabs.original}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[300px]">
        {activeTab === 'translated' && (
          <div>
            {isPrescription ? renderTranslatedPrescription() : renderTranslatedReport()}
            <div className="mt-6 p-3 bg-gray-50 text-gray-500 text-xs text-center border-t rounded">
              {result.translation.disclaimer}
            </div>
          </div>
        )}

        {activeTab === 'extracted' && (
          <div>
            {isPrescription ? renderPrescriptionTable() : renderReportSummary()}
          </div>
        )}

        {activeTab === 'summary' && !isPrescription && renderReportSummary()}

        {activeTab === 'original' && originalImageSrc && (
          <div className="flex justify-center">
            <img src={originalImageSrc} alt="Original document" className="max-w-full max-h-[600px] rounded border" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;