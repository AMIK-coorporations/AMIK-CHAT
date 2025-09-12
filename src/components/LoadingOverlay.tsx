import React from "react";

interface LoadingOverlayProps {
	message?: string;
	fullscreen?: boolean;
	className?: string;
}

export default function LoadingOverlay({ message = "لوڈ ہو رہا ہے", fullscreen = true, className = "" }: LoadingOverlayProps) {
	return (
		<div className={(fullscreen ? "fixed inset-0 " : "") + "flex items-center justify-center z-50 pointer-events-none"}>
			<div className={"flex flex-col items-center gap-2 p-3 bg-background/90 text-foreground rounded-lg shadow-lg pointer-events-auto " + className}>
				<div className="amik-spinner" aria-hidden="true">
					<span className="amik-spinner-dot" />
				</div>
				<p className="text-xs font-medium mt-1">{message}</p>
			</div>
		</div>
	);
} 