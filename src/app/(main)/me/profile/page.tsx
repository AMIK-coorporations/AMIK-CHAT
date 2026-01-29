"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, QrCode, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React from "react";
import { downloadImage, uploadUserAvatarReliable } from "@/lib/avatarService";
import { useToast } from "@/hooks/use-toast";

export default function ProfileDetailsPage() {
	const router = useRouter();
	const { userData, user, updateProfile } = useAuth();
	const { toast } = useToast();

	const [avatarOpen, setAvatarOpen] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement | null>(null);
	const [isUploading, setIsUploading] = React.useState(false);
	const [progress, setProgress] = React.useState(0);
	const [tempPreview, setTempPreview] = React.useState<string | null>(null);

	const currentAvatar = tempPreview || userData?.avatarUrl || (userData as any)?.photoURL || "";

	const handlePickFile = () => fileInputRef.current?.click();
	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !user) return;
		try {
			setIsUploading(true);
			setProgress(0);
			setTempPreview(URL.createObjectURL(file));
			if (!file.type.startsWith("image/")) {
				toast({ variant: "destructive", title: "غلط فائل", description: "براہ کرم صرف تصویر منتخب کریں۔" });
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				toast({ variant: "destructive", title: "فائل بہت بڑی ہے", description: "حد 5MB ہے۔" });
				return;
			}
			const start = toast({ title: "اپ لوڈ ہو رہا ہے...", description: "براہ کرم انتظار کریں۔" });
			const url = await uploadUserAvatarReliable(file, user.uid, (p) => setProgress(p));
			await updateProfile({ avatarUrl: url, photoURL: url } as any);
			toast({ id: start.id, title: "ہو گیا", description: "پروفائل تصویر اپ ڈیٹ ہو گئی۔" });
			setTempPreview(null);
		} finally {
			setIsUploading(false);
			setProgress(0);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return (
		<div>
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<h1 className="flex-1 truncate text-lg font-semibold">پروفائل</h1>
			</header>

			<div className="p-4 space-y-6">
				<Card>
					<CardContent className="p-0">
						<div className="divide-y">
							<button className="w-full flex items-center p-4 transition-colors hover:bg-muted/50" onClick={() => setAvatarOpen(true)}>
								<span className="flex-1 font-medium">پروفائل تصویر</span>
								<span className="text-muted-foreground flex items-center gap-2">
									{currentAvatar ? <span>دیکھیں / تبدیل</span> : <span>شامل کریں</span>}
								</span>
								<ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
							</button>
							<Link href="/me/profile/name" className="flex items-center p-4 transition-colors hover:bg-muted/50">
								<span className="flex-1 font-medium">نام</span>
								<span className="text-muted-foreground">{userData?.name || '—'}</span>
								<ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
							</Link>
							<Link href="/me/profile/gender" className="flex items-center p-4 transition-colors hover:bg-muted/50">
								<span className="flex-1 font-medium">صنف</span>
								<span className="text-muted-foreground">{userData?.gender || '—'}</span>
								<ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
							</Link>
							<Link href="/me/profile/region" className="flex items-center p-4 transition-colors hover:bg-muted/50">
								<span className="flex-1 font-medium">علاقہ</span>
								<span className="text-muted-foreground">{userData?.region || '—'}</span>
								<ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
							</Link>
							<Link href="/me/profile/address" className="flex items-center p-4 transition-colors hover:bg-muted/50">
								<span className="flex-1 font-medium">پتا</span>
								<span className="text-muted-foreground truncate max-w-[50%]">{userData?.address || '—'}</span>
								<ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
							</Link>
							<div className="flex items-center p-4 gap-2">
								<span className="flex-1 font-medium">اے ایم آئی کے گفتگو شناخت</span>
								<span className="text-muted-foreground break-all">{user?.uid}</span>
								<button
									className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-muted-foreground/30 hover:border-accent hover:bg-accent/10 text-accent transition-colors"
									title="شناخت کاپی کریں"
									onClick={async () => { if (!user?.uid) return; await navigator.clipboard.writeText(user.uid); toast({ title: 'کاپی ہوگیا', description: 'شناخت کلپ بورڈ میں کاپی ہو گئی۔' }); }}
								>
									{/* using unicode copy icon for simplicity */}
									<span className="text-sm">⧉</span>
								</button>
							</div>
							<Link href="/qr" className="flex items-center p-4 transition-colors hover:bg-muted/50">
								<QrCode className="h-5 w-5 text-accent mr-4" />
								<span className="flex-1 font-medium">میرا کیو آر کوڈ</span>
								<ChevronRight className="h-5 w-5 text-muted-foreground" />
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle>پروفائل تصویر</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4">
						<img src={currentAvatar || "https://iili.io/fU7NHil.png"} alt="avatar" className="w-40 h-40 rounded-full object-cover border" />
						<div className="grid grid-cols-1 gap-2 w-full">
							<Button variant="secondary" onClick={handlePickFile} disabled={isUploading}>{isUploading ? `اپ لوڈ ہو رہا ہے... ${progress}%` : "نئی تصویر منتخب کریں"}</Button>
							<Button variant="outline" onClick={() => currentAvatar && downloadImage(currentAvatar, 'profile.jpg')}>گیلری میں محفوظ کریں</Button>
							<Button variant="destructive" onClick={async () => { if (!userData?.name) return; const fallback = `https://placehold.co/100x100.png?text=${(userData.name || 'A').charAt(0).toUpperCase()}`; await updateProfile({ avatarUrl: fallback, photoURL: fallback } as any); }}>حذف کریں</Button>
						</div>
						<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
					</div>
					<DialogFooter>
						<Button onClick={() => setAvatarOpen(false)} className="w-full">بند کریں</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
} 