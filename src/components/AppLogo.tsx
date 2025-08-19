import Image from "next/image";

export type AppLogoProps = {
	className?: string;
	width?: number;
	height?: number;
	alt?: string;
};

export default function AppLogo({ className, width = 64, height = 64, alt = "AMIK Chat" }: AppLogoProps) {
	return (
		<Image
			src="/logo.png"
			alt={alt}
			width={width}
			height={height}
			className={className}
			priority
		/>
	);
} 