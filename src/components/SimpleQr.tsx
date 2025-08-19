"use client";

import QRCode from 'react-qr-code';

export type SimpleQrProps = {
	value: string;
	className?: string;
	size?: number;
};

export default function SimpleQr({ value, className, size = 256 }: SimpleQrProps) {
	return (
		<div className={className}>
			<QRCode
				value={value}
				size={size}
				fgColor="#22c55e"
				bgColor="#FFFFFF"
				level="H"
			/>
		</div>
	);
} 