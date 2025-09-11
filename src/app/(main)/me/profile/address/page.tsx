"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function EditAddressPage() {
	const { userData, updateProfile } = useAuth();
	const [address, setAddress] = React.useState(userData?.address || "");
	const [saving, setSaving] = React.useState(false);
	const router = useRouter();

	const save = async () => {
		if (!address.trim()) return;
		setSaving(true);
		await updateProfile({ address });
		setSaving(false);
		router.back();
	};

	return (
		<div>
			<header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background p-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<h1 className="text-lg font-semibold">پتا</h1>
			</header>
			<div className="p-4 space-y-4">
				<Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="اپنا پتا لکھیں" />
				<Button className="w-full" onClick={save} disabled={saving}>{saving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}</Button>
			</div>
		</div>
	);
} 