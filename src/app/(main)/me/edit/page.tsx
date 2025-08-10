"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Loader2, RefreshCw } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "نام کم از کم 2 حروف کا ہونا چاہیے۔" }).max(50),
  avatarUrl: z.string().url({ message: "براہ کرم ایک درست یو آر ایل درج کریں۔" }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { userData, updateProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      avatarUrl: "",
    },
  });

  const avatarUrl = form.watch("avatarUrl");
  const name = form.watch("name");

  useEffect(() => {
    if (userData) {
      form.reset({
        name: userData.name || "",
        avatarUrl: userData.avatarUrl || "",
      });
    }
  }, [userData, form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      await updateProfile({ 
        name: data.name,
        avatarUrl: data.avatarUrl || `https://placehold.co/100x100.png?text=${data.name.charAt(0).toUpperCase()}`
      });
      toast({
        title: "پروفائل اپ ڈیٹ ہو گئی",
        description: "آپ کی پروفائل کامیابی سے اپ ڈیٹ ہو گئی ہے۔",
      });
      router.push("/me");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "اپ ڈیٹ ناکام",
        description: "آپ کی پروفائل کو اپ ڈیٹ کرتے وقت کچھ غلط ہو گیا۔",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const generateNewAvatar = () => {
    const currentName = form.getValues("name") || 'A';
    const newAvatar = `https://placehold.co/100x100.png?text=${currentName.charAt(0).toUpperCase()}&c=${Date.now()}`;
    form.setValue('avatarUrl', newAvatar, { shouldDirty: true });
  }

  if (authLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>لوڈ ہو رہا ہے...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Link href="/me" className="p-1 rounded-md hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold">پروفائل میں ترمیم کریں</h1>
      </header>

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>آپ کی معلومات</CardTitle>
            <CardDescription>اپنا صارف نام اور پروفائل تصویر اپ ڈیٹ کریں۔</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex flex-col items-center gap-4 pt-4">
                   <Avatar className="h-24 w-24 border">
                      <AvatarImage src={avatarUrl || ''} alt={name} data-ai-hint="profile person"/>
                      <AvatarFallback className="text-4xl">
                        {(name || 'A').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  <Button type="button" variant="outline" onClick={generateNewAvatar}>
                    <RefreshCw className="h-4 w-4" />
                    نیا اوتار بنائیں
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صارف نام</FormLabel>
                      <FormControl>
                        <Input placeholder="آپ کا نام" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  تبدیلیاں محفوظ کریں
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
