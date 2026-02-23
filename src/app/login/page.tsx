import { Metadata } from "next";
import LoginClient from "@/components/LoginClient";

export const metadata: Metadata = {
    title: 'Login | AMIK CHAT',
    description: 'Login to your AMIK CHAT account.',
};

export default function LoginPage() {
    return <LoginClient />;
}
