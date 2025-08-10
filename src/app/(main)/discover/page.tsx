
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  Search,
  ChevronRight,
  Aperture,
  Infinity,
  ScanLine,
  Sparkles,
  UsersRound,
  Puzzle,
  Map,
} from 'lucide-react';
import Link from 'next/link';

const ListItem = ({
  icon,
  label,
  children,
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
  href?: string;
}) => (
  <Link href={href}>
    <div className="flex items-center p-4 hover:bg-muted/50 active:bg-muted/60 cursor-pointer">
      <div className="mr-4">{icon}</div>
      <span className="flex-1 font-medium">{label}</span>
      <div className="flex items-center gap-2 text-muted-foreground">
        {children}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
    </div>
  </Link>
);


export default function DiscoverPage() {
  const router = useRouter();

  const handleComingSoon = () => {
    alert("یہ فیچر جلد آرہا ہے۔");
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <h1 className="text-xl font-bold">دریافت</h1>
        <div className="flex items-center gap-2">
            <Button dir="rtl" variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/search')}>
                <Search className="h-5 w-5" />
                <span className="sr-only">تلاش</span>
            </Button>
            <Button dir="rtl" variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/contacts/add')}>
                <Plus className="h-5 w-5" />
                <span className="sr-only">شامل کریں</span>
            </Button>
        </div>
      </header>
      
      <div className="mt-4 flex flex-col">
        <div className="divide-y border-y">
            <ListItem 
                icon={<Aperture className="h-6 w-6 text-blue-500" />}
                label="لمحات"
                href="#"
            />
             <ListItem 
                icon={<Infinity className="h-6 w-6 text-orange-500" />}
                label="چینلز"
                href="#"
            >
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="Muhammad Nasir" data-ai-hint="person avatar"/>
                        <AvatarFallback>MN</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">محمد ناصر</span>
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                </div>
            </ListItem>
        </div>
        
        <div className="mt-4 divide-y border-y">
            <ListItem 
                icon={<ScanLine className="h-6 w-6 text-sky-500" />}
                label="کیو آر اسکین"
                href="/scan"
            />
        </div>
        
        <div className="mt-4 divide-y border-y">
            <ListItem 
                icon={<Map className="h-6 w-6 text-green-500" />}
                label="اے ایم آئی کے نقشہ"
                href="/map"
            />
        </div>

        <div className="mt-4 divide-y border-y">
            <ListItem 
                icon={<Sparkles className="h-6 w-6 text-red-500" />}
                label="تلاش"
                href="/search"
            />
        </div>
        
        <div className="mt-4 divide-y border-y">
            <ListItem 
                icon={<UsersRound className="h-6 w-6 text-blue-500" />}
                label="قریبی لوگ"
                href="#"
            />
        </div>
        
        <div className="mt-4 divide-y border-y">
            <ListItem 
                icon={<Puzzle className="h-6 w-6 text-purple-500" />}
                label="منی پروگرامز"
                href="#"
            />
        </div>
      </div>
    </div>
  );
}
