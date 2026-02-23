"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BackButtonProps {
    className?: string;
}

export default function BackButton({ className }: BackButtonProps) {
    const router = useRouter();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className={className}
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
    );
}
