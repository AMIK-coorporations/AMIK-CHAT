import { Metadata } from "next";
import SignupClient from "@/components/SignupClient";

export const metadata: Metadata = {
    title: 'Create Account | AMIK CHAT',
    description: 'Create a new AMIK CHAT account to start chatting.',
};

export default function SignupPage() {
    return <SignupClient />;
}
