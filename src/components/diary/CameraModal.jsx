import React, { useRef, useState } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [img, setImg] = useState(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    videoRef.current.srcObject = stream;
  };

  const takePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setImg(canvas.toDataURL('image/jpeg'));
    // Stop camera
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
  };

  React.useEffect(() => { startCamera(); }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-10 right-6 text-white opacity-50"><X size={32}/></button>
      
      {!img ? (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-[70vh] object-cover" />
          <button onClick={takePhoto} className="mt-10 w-20 h-20 bg-white rounded-full border-8 border-white/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-black/10" />
          </button>
        </>
      ) : (
        <>
          <img src={img} className="w-full max-h-[70vh] object-cover" />
          <div className="flex gap-10 mt-10">
            <button onClick={() => setImg(null)} className="p-4 bg-white/10 rounded-full text-white"><X size={24}/></button>
            <button onClick={() => onCapture(img)} className="p-4 bg-spa-gold rounded-full text-white"><Check size={24}/></button>
          </div>
        </>
      )}
    </div>
  );
};