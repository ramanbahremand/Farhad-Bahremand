import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Zap } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../constants';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  language: Language;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, language }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const texts = UI_TEXT[language].camera;

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 }, // Request high resolution
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera Error:", err);
      setError(texts.permission);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas to match video resolution for highest quality
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "scanned_document.jpg", { type: "image/jpeg" });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95); // High quality JPEG
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/50 p-4 flex justify-between items-center text-white absolute top-0 w-full z-10">
        <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
          <X size={24} />
        </button>
        <span className="font-medium">{texts.capture}</span>
        <button onClick={switchCamera} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
          <RefreshCw size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-grow relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-8">
            <p>{error}</p>
            <button onClick={startCamera} className="mt-4 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">{UI_TEXT[language].tryAgain}</button>
          </div>
        ) : (
          <>
             <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute w-full h-full object-cover"
            />
            {/* Scanner Overlay Guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[80%] h-[60%] border-2 border-emerald-400/70 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] relative">
                 <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1"></div>
                 <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1"></div>
                 <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1"></div>
                 <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1"></div>
              </div>
              <div className="absolute bottom-20 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                 Align document or QR code
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black p-8 pb-12 flex justify-center items-center gap-12">
         <button 
           onClick={handleCapture}
           className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:scale-105 transition-transform shadow-lg flex items-center justify-center"
         >
            <div className="w-16 h-16 rounded-full bg-emerald-600 border-2 border-white"></div>
         </button>
      </div>

      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;