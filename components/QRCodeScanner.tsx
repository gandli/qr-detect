'use client'

import { useEffect, useRef, useState } from 'react'
import { scan, ready } from 'qr-scanner-wechat'
import type { ScanResult } from 'qr-scanner-wechat'
import { Button } from '@/components/ui/button'

export default function QRCodeScanner() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // 切换前后置摄像头

    const startCamera = async (mode: 'user' | 'environment') => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: mode,
                        width: 512,
                        height: 512,
                    },
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
    }, [facingMode]);

    const toggleCamera = () => {
        setFacingMode((prevMode) => (prevMode === 'user' ? 'environment' : 'user'));
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <video ref={videoRef} autoPlay playsInline className='w-md h-md' />
            <Button onClick={toggleCamera} className='mt-4'>
                切换摄像头
            </Button>
        </div>
    );
}
