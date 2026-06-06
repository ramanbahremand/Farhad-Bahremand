import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="flex bg-blue-50 p-1 rounded-lg border border-blue-100">
      <button 
        onClick={() => onLanguageChange(Language.EN)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentLanguage === Language.EN ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
      >
        English
      </button>
      <button 
        onClick={() => onLanguageChange(Language.FA)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentLanguage === Language.FA ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
      >
        فارسی
      </button>
      <button 
        onClick={() => onLanguageChange(Language.KU)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentLanguage === Language.KU ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
      >
        کوردی (سۆرانی)
      </button>
    </div>
  );
};

export default LanguageSelector;