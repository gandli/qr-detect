'use client'

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
const Camera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // 切换前后置摄像头

  const startCamera = async (mode: 'user' | 'environment') => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode }, // 指定前置或后置摄像头
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [facingMode]); // 当 facingMode 改变时重新启动摄像头

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === 'user' ? 'environment' : 'user'));
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
      <Button onClick={toggleCamera} className="mt-4 p-2 bg-blue-500 text-white rounded">
        切换摄像头
      </Button>
    </div>
  );
};

export default Camera;
