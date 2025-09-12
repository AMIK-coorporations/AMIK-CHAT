"use client";

import LoadingOverlay from "@/components/LoadingOverlay";

export default function MainSegmentLoading() {
	return (
		<div className="fixed inset-0 pointer-events-none">
			<LoadingOverlay />
		</div>
	);
} 