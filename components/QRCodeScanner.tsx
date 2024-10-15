"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { scan, ready, type ScanResult } from "qr-scanner-wechat";  // 引入 ScanResult 类型

const QRCodeScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [result, setResult] = useState<string | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                // 等待 qr-scanner-wechat 的 WebAssembly 模型准备就绪
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

    // 当 video 元数据加载后，设置视频准备就绪的状态
    const handleLoadedMetadata = () => {
        setIsVideoReady(true);

        // 设置 canvas 尺寸与视频一致
        if (overlayCanvasRef.current && videoRef.current) {
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;

            const canvas = overlayCanvasRef.current;
            const dpr = window.devicePixelRatio || 1; // 处理高分辨率屏幕
            canvas.width = videoWidth * dpr;
            canvas.height = videoHeight * dpr;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.scale(dpr, dpr); // 缩放上下文，适应设备像素比
            }
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
                // 将视频帧绘制到 canvas 上
                ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

                try {
                    // 扫描二维码
                    const qrResult: ScanResult | null = await scan(canvas);
                    setResult(qrResult?.text || null);

                    // 绘制外框到 overlayCanvas 上
                    const overlayCtx = overlayCanvasRef.current.getContext("2d");
                    if (overlayCtx) {
                        // 清空上一次的绘制
                        overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

                        // 绘制二维码矩形外框
                        if (qrResult?.rect) {
                            overlayCtx.strokeStyle = 'red';
                            overlayCtx.lineWidth = 2;
                            overlayCtx.strokeRect(
                                qrResult.rect.x,
                                qrResult.rect.y,
                                qrResult.rect.width,
                                qrResult.rect.height
                            );

                            // 在矩形左上角标注扫描结果
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
        const interval = setInterval(scanFrame, 100); // 每 100ms 扫描一帧
        return () => clearInterval(interval);
    }, [isVideoReady]);

    const handleToggleCamera = () => {
        setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    };

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
            <Button
                onClick={handleToggleCamera}
                className="mt-4"
            >
                切换摄像头
            </Button>
            <p className={`min-w-[350px] max-w-[350px] w-[350px] mt-4 p-4 bg-blue-100 text-blue-700 rounded-lg break-words whitespace-pre-wrap transition-opacity duration-300 ${result ? "opacity-100" : "opacity-0"}`}>
                {result ? `扫描结果: ${result}` : "扫描中..."}
            </p>
        </div>
    );


};

export default QRCodeScanner;
