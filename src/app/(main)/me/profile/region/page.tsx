"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function EditRegionPage() {
	const { userData, updateProfile } = useAuth();
	const [region, setRegion] = React.useState(userData?.region || "");
	const [saving, setSaving] = React.useState(false);
	const router = useRouter();

	const save = async () => {
		if (!region.trim()) return;
		setSaving(true);
		await updateProfile({ region });
		setSaving(false);
		router.back();
	};

	return (
		<div>
			<header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background p-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<h1 className="text-lg font-semibold">علاقہ</h1>
			</header>
			<div className="p-4 space-y-4">
				<Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="اپنا علاقہ لکھیں" />
				<Button className="w-full" onClick={save} disabled={saving}>{saving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}</Button>
			</div>
		</div>
	);
} 