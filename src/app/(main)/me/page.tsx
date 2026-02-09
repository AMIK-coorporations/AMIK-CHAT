
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, LogOut, Settings, UserCircle, QrCode, Plus, MessageCircle, UserPlus, ScanLine, Landmark, Copy, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { uploadUserAvatarReliable, downloadImage } from '@/lib/avatarService';
import { useToast } from '@/hooks/use-toast';
import React from "react";


export default function MePage() {
  const router = useRouter();
  const { userData, user, updateProfile, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [tempPreview, setTempPreview] = React.useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = React.useState<string | null>(null);
  const [pageLoading, setPageLoading] = React.useState(true);

  React.useEffect(() => {
    if (!tempPreview) {
      setCurrentAvatar(userData?.avatarUrl || null);
    }
  }, [userData?.avatarUrl]);

  // Add loading timeout for profile page
  React.useEffect(() => {
    if (!authLoading && (userData || !user)) {
      setPageLoading(false);
      return;
    }

    // Set timeout for loading (15 seconds)
    const timeout = setTimeout(() => {
      setPageLoading(false);
      console.warn('Profile page loading timeout');
      if (!userData && user) {
        toast({
          variant: 'destructive',
          title: 'لوڈنگ میں تاخیر',
          description: 'پروفائل لوڈ ہونے میں زیادہ وقت لگ رہا ہے۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں۔',
          duration: 5000,
        });
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [authLoading, userData, user, toast]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: 'destructive',
        title: 'خرابی',
        description: 'لاگ آؤٹ کرنے میں مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔'
      });
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setIsUploading(true);
      setProgress(0);
      // Instant local preview
      const localUrl = URL.createObjectURL(file);
      setTempPreview(localUrl);
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'غلط فائل', description: 'براہ کرم صرف تصویر منتخب کریں۔' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'فائل بہت بڑی ہے', description: 'حد 5MB ہے۔' });
        return;
      }
      const start = toast({ title: 'اپ لوڈ ہو رہا ہے...', description: 'براہ کرم انتظار کریں۔' });
      const url = await uploadUserAvatarReliable(file, user.id, (p) => setProgress(p));
      await updateProfile({ avatarUrl: url, photoURL: url } as any);
      setCurrentAvatar(url); // keep it visible immediately
      toast({ id: start.id, title: 'ہو گیا', description: 'پروفائل تصویر اپ ڈیٹ ہو گئی۔' });
      setTempPreview(null); // switch from local preview to uploaded url
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const handleDelete = async () => {
    if (!userData?.name || !updateProfile) return;
    const fallback = `https://placehold.co/100x100.png?text=${(userData.name || 'A').charAt(0).toUpperCase()}`;
    await updateProfile({ avatarUrl: fallback, photoURL: fallback } as any);
    setCurrentAvatar(fallback);
    toast({ title: 'حذف ہو گئی', description: 'پروفائل تصویر ہٹا دی گئی۔' });
  };

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <h1 className="text-xl font-bold">میں</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-5 w-5" />
                <span className="sr-only">شامل کریں</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push('/chats/new')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                <span>نئی چیٹ</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/contacts/add')}>
                <UserPlus className="h-4 w-4 mr-2" />
                <span>رابطے شامل کریں</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/scan')}>
                <ScanLine className="h-4 w-4 mr-2" />
                <span>کیو آر اسکین</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/money')}>
                <Landmark className="h-4 w-4 mr-2" />
                <span>پیسے</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {userData && user ? (
          <div className="flex items-center gap-4">
            <button className="relative" onClick={() => router.push('/me/profile')} aria-label="پروفائل تصویر کھولیں">
              <Avatar className="h-20 w-20 border">
                <AvatarImage src={tempPreview || currentAvatar || userData.avatarUrl || (userData as any).photoURL || ''} alt={userData.name ?? 'User'} data-ai-hint="profile person" />
                <AvatarFallback className="text-3xl">{(userData.name ?? 'U').charAt(0)}</AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1">
              <p className="text-xl font-semibold">{userData.name ?? 'Unknown User'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">اے ایم آئی کے گفتگو شناخت</span>
                <button
                  className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-muted-foreground/30 hover:border-accent hover:bg-accent/10 text-accent transition-colors"
                  title="اے ایم آئی کے شناخت کاپی کریں"
                  onClick={async () => { await navigator.clipboard.writeText(user.id); toast({ title: 'کاپی ہوگیا', description: 'شناخت کلپ بورڈ میں کاپی ہو گئی۔' }); }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* ID remains hidden; only label + copy button shown */}
            </div>
            <Link href="/qr" className="p-2 rounded-md hover:bg-muted">
              <QrCode className="h-6 w-6 text-muted-foreground" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        )}

        {/* Avatar editing moved to /me/profile */}

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <Link href="/me/edit" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                <UserCircle className="h-6 w-6 text-accent mr-4" />
                <span className="flex-1 font-medium">پروفائل میں ترمیم کریں</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link href="/me/settings" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                <Settings className="h-6 w-6 text-accent mr-4" />
                <span className="flex-1 font-medium">ترتیبات</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link href="https://docs.amikchat.site" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                <FileText className="h-6 w-6 text-accent mr-4" />
                <span className="flex-1 font-medium">دستاویزات</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          کھاتہ خروج
        </Button>
      </div>
    </div>
  );
}
