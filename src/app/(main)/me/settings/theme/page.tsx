"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, Moon, Sun, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

function applyTheme(mode: string) {
	if (mode === 'dark') {
		document.documentElement.classList.add('dark');
		localStorage.setItem('theme', 'dark');
	} else if (mode === 'light') {
		document.documentElement.classList.remove('dark');
		localStorage.setItem('theme', 'light');
	} else {
		// system
		localStorage.setItem('theme', 'system');
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		if (mql.matches) document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	}
}

export default function ThemePage() {
	const router = useRouter();
	const [current, setCurrent] = React.useState('system');

	React.useEffect(() => {
		const saved = localStorage.getItem('theme') || 'system';
		setCurrent(saved);
	}, []);

	const choose = (mode: 'dark'|'light'|'system') => {
		setCurrent(mode);
		applyTheme(mode);
	};

	return (
		<div>
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<h1 className="flex-1 truncate text-lg font-semibold">پس منظر</h1>
			</header>
			<div className="p-4 space-y-3">
				<Button className="w-full justify-between" variant={current==='dark'?'default':'outline'} onClick={() => choose('dark')}>
					<span className="flex items-center gap-2"><Moon className="h-4 w-4"/>اندھیرا</span>
				</Button>
				<Button className="w-full justify-between" variant={current==='light'?'default':'outline'} onClick={() => choose('light')}>
					<span className="flex items-center gap-2"><Sun className="h-4 w-4"/>روشنی</span>
				</Button>
				<Button className="w-full justify-between" variant={current==='system'?'default':'outline'} onClick={() => choose('system')}>
					<span className="flex items-center gap-2"><Monitor className="h-4 w-4"/>آلہ کی طے شدہ</span>
				</Button>
			</div>
		</div>
	);
} 