'use client'

import { useEffect, useRef, useState } from 'react'
import { scan, ready, ScanResult } from 'qr-scanner-wechat'

export default function QRCodeScanner() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
                if (permissions.state === 'denied') {
                    throw new Error('Camera access denied. Please enable camera permissions in your browser settings.');
                }
            } catch (e) {
                setError('Failed to check camera permissions.');
                console.error(e);
                return;
            }
        };

        const initStream = async () => {
            try {
                await checkPermissions();
                await ready();

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        width: 512,
                        height: 512,
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setLoading(false);  // 视频加载完成后再设置 loading 为 false
                    };

                    const scanFrame = async () => {
                        if (!videoRef.current || !overlayCanvasRef.current) return;

                        const canvas = document.createElement('canvas');
                        const videoWidth = videoRef.current.videoWidth;
                        const videoHeight = videoRef.current.videoHeight;

                        if (videoWidth === 0 || videoHeight === 0) return; // 确保宽度和高度不为 0

                        canvas.width = videoWidth;
                        canvas.height = videoHeight;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

                        try {
                            const result: ScanResult | null = await scan(canvas, { includeRectCanvas: true });
                            setScanResult(result);

                            const overlayCtx = overlayCanvasRef.current.getContext('2d');
                            if (overlayCtx) {
                                const dpr = window.devicePixelRatio || 1;
                                const scaledWidth = videoWidth * dpr;
                                const scaledHeight = videoHeight * dpr;

                                overlayCanvasRef.current.width = scaledWidth;
                                overlayCanvasRef.current.height = scaledHeight;
                                overlayCtx.scale(dpr, dpr);

                                overlayCtx.clearRect(0, 0, videoWidth, videoHeight);

                                if (result?.rect) {
                                    overlayCtx.strokeStyle = 'red';
                                    overlayCtx.lineWidth = 2;
                                    overlayCtx.strokeRect(
                                        result.rect.x,
                                        result.rect.y,
                                        result.rect.width,
                                        result.rect.height
                                    );

                                    if (result.text) {
                                        overlayCtx.font = '16px Arial';
                                        overlayCtx.fillStyle = 'blue';
                                        overlayCtx.fillText(result.text, result.rect.x + 5, result.rect.y - 5);
                                    }
                                }
                            }
                        } catch (scanError) {
                            console.error("Scan error:", scanError);
                        }
                    };

                    const intervalId = setInterval(scanFrame, 100);

                    return () => {
                        clearInterval(intervalId);
                        stream.getTracks().forEach(track => track.stop());
                    };
                }
            } catch (e) {
                setError('Failed to access the camera or start scanning.');
                console.error(e);
            }
        };

        initStream();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    let content;
    if (error) {
        content = <div className="text-red-500">{error}</div>;
    } else if (loading) {
        content = <div className="text-lg">Loading camera...</div>;
    } else {
        content = (
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-full max-w-md">
                    <video
                        ref={videoRef}
                        id="video"
                        className="w-full h-auto"
                    />
                    <canvas
                        ref={overlayCanvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                    />
                </div>

                {/* 显示扫描结果 */}
                {scanResult?.text ? (
                    <div
                        className="mt-4 p-4 w-[400px] bg-blue-100 text-blue-700 rounded-lg break-words whitespace-pre-wrap"
                    >
                        Scanned Text: {scanResult.text}
                    </div>
                ) : (
                    <div
                        className="mt-4 p-4 w-[400px] bg-gray-100 text-gray-700 rounded-lg text-center"
                    >
                        No QR code detected.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-between items-center w-screen h-screen p-4">
            {content}
        </div>
    );
}
