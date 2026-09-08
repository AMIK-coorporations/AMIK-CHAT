import { Metadata } from "next";
import OtpClient from "@/components/OtpClient";

export const metadata: Metadata = {
    title: 'OTP Verification | AMIK CHAT',
    description: 'Verify your account OTP to start chatting.',
};

export default function OtpPage() {
    return <OtpClient />;
}
