"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

export type StyledQrProps = {
	value: string;
	className?: string;
	logoUrl?: string;
	size?: number;
};

export default function StyledQr({ value, className, logoUrl = "/logo.png", size = 312 }: StyledQrProps) {
	const ref = useRef<HTMLDivElement>(null);
	const qrRef = useRef<QRCodeStyling | null>(null);

	useEffect(() => {
		if (!ref.current) return;

		qrRef.current = new QRCodeStyling({
			width: size,
			height: size,
			type: "svg",
			data: value,
			margin: 8,
			dotsOptions: {
				color: "#22c55e",
				type: "rounded",
				gradient: {
					type: "linear",
					rotation: 0,
					colorStops: [
						{ offset: 0, color: "#22c55e" },
						{ offset: 1, color: "#16a34a" },
					],
				},
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
				imageSize: 0.24,
				hideBackgroundDots: true,
			},
		});

		qrRef.current.append(ref.current);

		return () => {
			if (ref.current) ref.current.innerHTML = "";
			qrRef.current = null;
		};
	}, [value, size, logoUrl]);

	useEffect(() => {
		if (!qrRef.current) return;
		qrRef.current.update({ data: value });
	}, [value]);

	return <div ref={ref} className={className} />;
} 