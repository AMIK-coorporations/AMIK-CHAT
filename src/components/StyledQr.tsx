"use client";

import { useEffect, useRef, useState } from "react";

export type StyledQrProps = {
	value: string;
	className?: string;
	logoUrl?: string;
	size?: number;
	onError?: () => void;
};

export default function StyledQr({ value, className, logoUrl = "/logo.png", size = 312, onError }: StyledQrProps) {
	const ref = useRef<HTMLDivElement>(null);
	const qrRef = useRef<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!ref.current) return;

		// Dynamically import QRCodeStyling only on client side
		const loadQRCode = async () => {
			try {
				// Check if we're in browser environment
				if (typeof window === 'undefined') {
					setError('Not in browser environment');
					setIsLoading(false);
					onError?.();
					return;
				}

				const QRCodeStyling = (await import("qr-code-styling")).default;
				
				// Create QR code instance with simpler options
				qrRef.current = new QRCodeStyling({
					width: size,
					height: size,
					type: "svg",
					data: value,
					margin: 8,
					dotsOptions: {
						color: "#22c55e",
						type: "rounded",
					},
					cornersSquareOptions: {
						color: "#22c55e",
						type: "extra-rounded",
					},
					cornersDotOptions: {
						color: "#22c55e",
						type: "dot",
					},
					backgroundOptions: {
						color: "#ffffff",
					},
					image: logoUrl,
					imageOptions: {
						crossOrigin: "anonymous",
						margin: 2,
						imageSize: 0.2,
						hideBackgroundDots: true,
					},
				});

				// Append to DOM
				qrRef.current.append(ref.current);
				setIsLoading(false);
			} catch (err) {
				console.error('Failed to create QR code:', err);
				setError('Failed to generate QR code');
				setIsLoading(false);
				onError?.();
			}
		};

		loadQRCode();

		return () => {
			if (ref.current) {
				ref.current.innerHTML = "";
			}
			qrRef.current = null;
		};
	}, [value, size, logoUrl, onError]);

	useEffect(() => {
		if (!qrRef.current) return;
		try {
			qrRef.current.update({ data: value });
		} catch (err) {
			console.error('Failed to update QR code:', err);
		}
	}, [value]);

	if (error) {
		return (
			<div className={`${className} flex items-center justify-center bg-red-50 text-red-600 p-4 rounded`}>
				{error}
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className={`${className} bg-gray-100 animate-pulse rounded`} style={{ width: size, height: size }} />
		);
	}

	return <div ref={ref} className={className} />;
} 