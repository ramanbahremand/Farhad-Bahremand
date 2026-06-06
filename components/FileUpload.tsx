import React, { useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, Camera } from 'lucide-react';
import { UI_TEXT } from '../constants';
import { Language } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onOpenCamera: () => void;
  language: Language;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onOpenCamera, language }) => {
  const texts = UI_TEXT[language];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Camera Button (Blue Theme) */}
      <button 
        onClick={onOpenCamera}
        className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-[1.02] group"
      >
        <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition-colors">
          <Camera size={40} />
        </div>
        <h3 className="text-xl font-bold mb-2">{texts.cameraBtn}</h3>
        <p className="text-blue-100 text-sm text-center">Scan Document or QR Code</p>
      </button>

      {/* Upload Zone (Emerald Green Theme) */}
      <div 
        className="border-2 border-dashed border-emerald-300 rounded-xl p-8 text-center bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer group flex flex-col items-center justify-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          accept="image/*,.pdf" 
          onChange={handleInputChange}
        />
        
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 text-emerald-600" />
        </div>
        
        <h3 className="text-xl font-bold text-emerald-900 mb-2">{texts.uploadTitle}</h3>
        <div className="flex justify-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1"><ImageIcon size={16}/> JPG/PNG</span>
          <span className="flex items-center gap-1"><FileText size={16}/> PDF</span>
        </div>
        <button className="bg-white border border-emerald-200 text-emerald-700 px-4 py-1 rounded text-sm font-medium hover:bg-emerald-50 shadow-sm">
          {texts.uploadBtn}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;