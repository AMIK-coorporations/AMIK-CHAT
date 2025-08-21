"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronLeft, Globe, Smartphone, Download, X } from 'lucide-react';

const apps = [
	{
		title: 'AMIK QR CODE',
		url: 'https://amik-qr-code.vercel.app',
		logo: 'https://amik-qr-code.vercel.app/favicon.ico',
		androidApk: '/apks/amik-qr-code.apk',
		iosAppStore: 'https://apps.apple.com/app/amik-qr-code',
	},
	{
		title: 'AMIK AI AGENT',
		url: 'https://amik-ai-agent.vercel.app',
		logo: 'https://amik-ai-agent.vercel.app/favicon.ico',
		androidApk: '/apks/amik-ai-agent.apk',
		iosAppStore: 'https://apps.apple.com/app/amik-ai-agent',
	},
];

export default function MiniProgramsPage() {
	const router = useRouter();
	const [selectedApp, setSelectedApp] = useState<typeof apps[0] | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isIOSDialogOpen, setIsIOSDialogOpen] = useState(false);

	const handleAppClick = (app: typeof apps[0]) => {
		setSelectedApp(app);
		setIsDialogOpen(true);
	};

	const handleDownloadAPK = (apkUrl: string) => {
		const link = document.createElement('a');
		link.href = apkUrl;
		link.download = apkUrl.split('/').pop() || 'app.apk';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setIsDialogOpen(false);
	};

	const handleIOSClick = () => {
		setIsIOSDialogOpen(true);
		setIsDialogOpen(false);
	};

	return (
		<div>
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<h1 className="flex-1 truncate text-lg font-semibold">منی پروگرامز</h1>
			</header>

			<div className="p-4 flex flex-col gap-4">
				{apps.map((app) => (
					<Card 
						key={app.title} 
						className="hover:border-primary/50 hover:shadow-md transition-all w-full cursor-pointer"
						onClick={() => handleAppClick(app)}
					>
						<CardHeader className="flex flex-row items-center gap-4 py-3">
							<Image src={app.logo} alt={app.title} width={32} height={32} className="rounded" />
							<CardTitle className="text-lg">{app.title}</CardTitle>
						</CardHeader>
					</Card>
				))}
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3">
							{selectedApp && (
								<>
									<Image src={selectedApp.logo} alt={selectedApp.title} width={24} height={24} className="rounded" />
									<span>{selectedApp.title}</span>
								</>
							)}
						</DialogTitle>
					</DialogHeader>
					
					<div className="flex flex-col gap-3 pt-4">
						<Link href={selectedApp?.url || '#'} target="_blank" rel="noopener noreferrer">
							<Button variant="outline" className="w-full h-14 flex items-center gap-3 justify-start">
								<Globe className="h-5 w-5" />
								<div className="text-left">
									<div className="font-medium">ویب سائٹ</div>
									<div className="text-xs text-muted-foreground">براؤزر میں کھولیں</div>
								</div>
							</Button>
						</Link>
						
						<Button 
							variant="outline" 
							className="w-full h-14 flex items-center gap-3 justify-start"
							onClick={() => selectedApp && handleDownloadAPK(selectedApp.androidApk)}
						>
							<Download className="h-5 w-5" />
							<div className="text-left">
								<div className="font-medium">اینڈرائیڈ</div>
								<div className="text-xs text-muted-foreground">APK فائل ڈاؤن لوڈ کریں</div>
							</div>
						</Button>
						
						<Button 
							variant="outline" 
							className="w-full h-14 flex items-center gap-3 justify-start"
							onClick={handleIOSClick}
						>
							<Smartphone className="h-5 w-5" />
							<div className="text-left">
								<div className="font-medium">آئی فون</div>
								<div className="text-xs text-muted-foreground">iOS ایپ ڈاؤن لوڈ کریں</div>
							</div>
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={isIOSDialogOpen} onOpenChange={setIsIOSDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<Smartphone className="h-5 w-5 text-blue-500" />
							iOS ایپ کی تیاری جاری ہے
						</AlertDialogTitle>
						<AlertDialogDescription className="text-right text-base leading-relaxed">
							آپ کی iOS ایپ فی الحال تیار کی جا رہی ہے۔ ہم جلد ہی App Store پر اسے شائع کریں گے۔
							<br /><br />
							براہ کرم تھوڑا انتظار کریں یا ابھی ویب سائٹ استعمال کریں۔
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogAction className="w-full">ٹھیک ہے</AlertDialogAction>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
} 