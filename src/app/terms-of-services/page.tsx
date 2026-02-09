"use client";

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
    const router = useRouter();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 bg-background p-3 border-b">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Terms of Service</h1>
            </header>
            <main className="flex-1 p-6 max-w-4xl mx-auto prose dark:prose-invert">
                <h1>Terms of Service</h1>
                <p>Last updated: February 09, 2026</p>

                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using AMIK CHAT, you accept and agree to be bound by the terms and provision of this agreement.</p>

                <h2>2. Use of Service</h2>
                <p>You agree to use the app only for lawful purposes. You are responsible for all content you post and activity that occurs under your account.</p>

                <h2>3. User Conduct</h2>
                <p>You agree not to use the service to send spam, harass others, or share illegal content. We reserve the right to terminate accounts that violate these rules.</p>

                <h2>4. Limitation of Liability</h2>
                <p>AMIK CHAT is provided "as is". We are not liable for any damages arising from your use of the service.</p>

                <h2>5. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Your continued use of the service constitutes acceptance of those changes.</p>

                <h2>Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us at info@amikchat.site.</p>
            </main>
        </div>
    );
}
