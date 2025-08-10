"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MessageSquare, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chats", icon: MessageSquare, label: "چیٹس" },
  { href: "/contacts", icon: Users, label: "رابطے" },
  { href: "/discover", icon: Compass, label: "دریافت" },
  { href: "/me", icon: User, label: "میں" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-2xl border-t bg-background">
      <nav className="flex items-center justify-around p-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-4 py-1 text-xs font-medium transition-colors w-1/4 relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className="relative">
                <item.icon className="h-7 w-7" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
