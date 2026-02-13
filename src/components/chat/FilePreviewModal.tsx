
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, ZoomIn, ZoomOut, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    fileType: string;
    onDownload: () => void;
}

export function FilePreviewModal({
    isOpen,
    onClose,
    fileUrl,
    fileName,
    fileType,
    onDownload
}: FilePreviewModalProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    if (!isOpen) return null;

    const isImage = fileType.startsWith('image/');

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
    const handleRotate = () => setRotation(prev => prev + 90);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="font-semibold text-lg truncate max-w-[200px]">{fileName}</span>
                        <span className="text-xs text-white/70">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Edit/View Controls for Images */}
                    {isImage && (
                        <>
                            <Button variant="ghost" size="icon" onClick={handleRotate} className="text-white hover:bg-white/20">
                                <RotateCw className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/20">
                                <ZoomOut className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/20">
                                <ZoomIn className="h-5 w-5" />
                            </Button>
                        </>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDownload}
                        className="text-white hover:bg-white/20"
                    >
                        <Download className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
                {isImage ? (
                    <div
                        className="relative transition-transform duration-200 ease-out"
                        style={{
                            transform: `scale(${scale}) rotate(${rotation}deg)`,
                            maxWidth: '100%',
                            maxHeight: '100%'
                        }}
                    >
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-h-[85vh] max-w-[95vw] object-contain shadow-2xl"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-white">
                        <div className="w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center">
                            <Download className="h-12 w-12 opacity-50" />
                        </div>
                        <p className="text-lg">پیش منظر دستیاب نہیں ہے</p>
                        <Button onClick={onDownload} variant="secondary">
                            ڈاؤن لوڈ کریں
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
