"use client"; 

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { scan, ready, type ScanResult } from "qr-scanner-wechat";

const QRCodeScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [result, setResult] = useState<string | null>(null);
    const [responseData, setResponseData] = useState<any>(null); // 用于存储 API 响应
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                await ready();

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode, width: 512, height: 512 },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (error) {
                console.error("Error accessing camera: ", error);
            }
        };

        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
            }
        };
    }, [facingMode]);

    const handleLoadedMetadata = () => {
        setIsVideoReady(true);
        if (overlayCanvasRef.current && videoRef.current) {
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;

            const canvas = overlayCanvasRef.current;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = videoWidth * dpr;
            canvas.height = videoHeight * dpr;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.scale(dpr, dpr);
            }
        }
    };

    const fetchQRCodeData = async (scannedUrl: string) => {
        try {
            const response = await fetch("https://y2wm.cn/CigaretteQrcodeQuery/CodeQuery/scanCode/v1", {
                headers: {
                    accept: "application/json, text/plain, */*",
                    "content-type": "application/json;charset=UTF-8",
                },
                referrerPolicy: "strict-origin-when-cross-origin",
                body: JSON.stringify({
                    qrcode: scannedUrl,
                    clientInfo: navigator.userAgent,
                    latitude: null,
                    longitude: null,
                    ip: "",
                }),
                method: "POST",
            });
            const data = await response.json();
            setResponseData(data); // 将 API 响应数据存储到 state
        } catch (error) {
            console.error("Error fetching QR code data: ", error);
        }
    };

    const scanFrame = async () => {
        if (isVideoReady && videoRef.current && overlayCanvasRef.current) {
            const video = videoRef.current;
            const canvas = document.createElement("canvas");
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            canvas.width = videoWidth;
            canvas.height = videoHeight;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

                try {
                    const qrResult: ScanResult | null = await scan(canvas);
                    const scannedUrl = qrResult?.text || null;
                    setResult(scannedUrl);

                    if (scannedUrl && /^(https?:\/\/)/i.test(scannedUrl)) {
                        fetchQRCodeData(scannedUrl);
                    }

                    const overlayCtx = overlayCanvasRef.current.getContext("2d");
                    if (overlayCtx) {
                        overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

                        if (qrResult?.rect) {
                            overlayCtx.strokeStyle = 'red';
                            overlayCtx.lineWidth = 2;
                            overlayCtx.strokeRect(
                                qrResult.rect.x,
                                qrResult.rect.y,
                                qrResult.rect.width,
                                qrResult.rect.height
                            );
                            if (qrResult.text) {
                                overlayCtx.font = '16px Arial';
                                overlayCtx.fillStyle = 'blue';
                                overlayCtx.fillText(qrResult.text, qrResult.rect.x + 5, qrResult.rect.y - 5);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error scanning QR code: ", error);
                }
            }
        }
    };

    useEffect(() => {
        const interval = setInterval(scanFrame, 100);
        return () => clearInterval(interval);
    }, [isVideoReady]);

    const handleToggleCamera = () => {
        setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    };

    // 提取 meta 和 relationInfo
    const meta = responseData?.data?.codeData?.meta;
    const relationInfo = responseData?.data?.codeData?.relationInfo;

    return (
        <div className="flex flex-col items-center h-screen p-4">
            <div className="relative w-full max-w-lg">
                <video
                    ref={videoRef}
                    className="w-full h-auto"
                    autoPlay
                    playsInline
                    id="video"
                    onLoadedMetadata={handleLoadedMetadata}
                ></video>
                <canvas
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                ></canvas>
            </div>
            <Button onClick={handleToggleCamera} className="mt-4">
                切换摄像头
            </Button>
            <p className={`min-w-[350px] max-w-[350px] w-[350px] mt-4 p-4 bg-blue-100 text-blue-700 rounded-lg break-words whitespace-pre-wrap transition-opacity duration-300 ${result ? "opacity-100" : "opacity-0"}`}>
                {result ? `扫描结果: ${result}` : "扫描中..."}
            </p>

            {meta && relationInfo && (
                <div className="min-w-[350px] max-w-[350px] w-[350px] mt-4 p-4 bg-green-100 text-green-700 rounded-lg">
                    <h2 className="text-lg font-bold">Meta 信息:</h2>
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(meta, null, 2)}</pre>
                    
                    <h2 className="text-lg font-bold mt-4">Relation Info 信息:</h2>
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(relationInfo, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default QRCodeScanner;
