"use client";

import Image from "next/image";
import { useState } from "react";

export type AppLogoProps = {
	className?: string;
	width?: number;
	height?: number;
	alt?: string;
};

export default function AppLogo({ className, width = 48, height = 48, alt = "AMIK Chat" }: AppLogoProps) {
	const [imageError, setImageError] = useState(false);

	if (imageError) {
		return (
			<div
				className={`${className} bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-xs`}
				style={{ width, height }}
			>
				AMIK
			</div>
		);
	}

	return (
		<Image
			src="https://iili.io/fU7NHil.png"
			alt={alt}
			width={width}
			height={height}
			className={className}
			priority
			unoptimized={true}
			onError={() => {
				console.error('Failed to load logo image');
				setImageError(true);
			}}
		/>
	);
}