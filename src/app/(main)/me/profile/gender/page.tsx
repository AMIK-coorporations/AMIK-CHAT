"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function EditGenderPage() {
	const { userData, updateProfile } = useAuth();
	const [gender, setGender] = React.useState(userData?.gender || "");
	const [saving, setSaving] = React.useState(false);
	const router = useRouter();

	const save = async (value: string) => {
		setSaving(true);
		await updateProfile({ gender: value });
		setSaving(false);
		router.back();
	};

	return (
		<div>
			<header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background p-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<h1 className="text-lg font-semibold">صنف</h1>
			</header>
			<div className="p-4 space-y-4">
				<Button className="w-full" variant={gender === 'مرد' ? 'default' : 'outline'} disabled={saving} onClick={() => save('مرد')}>مرد</Button>
				<Button className="w-full" variant={gender === 'عورت' ? 'default' : 'outline'} disabled={saving} onClick={() => save('عورت')}>عورت</Button>
			</div>
		</div>
	);
} 