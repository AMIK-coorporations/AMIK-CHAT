"use client";

import { useState } from "react";
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
import { ChevronLeft, Loader2 } from "lucide-react";

const passwordFormSchema = z.object({
  password: z.string().min(6, { message: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "پاس ورڈز مماثل نہیں ہیں۔",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { changePassword } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    setIsSubmitting(true);
    try {
      await changePassword(data.password);
      toast({
        title: "پاس ورڈ اپ ڈیٹ ہو گیا",
        description: "آپ کا پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔",
      });
      router.back();
    } catch (error: any) {
      console.error("Error updating password:", error);
      let description = "کچھ غلط ہو گیا۔";
      if (error.code === 'auth/requires-recent-login') {
        description = "یہ کارروائی حساس ہے اور حالیہ تصدیق کی ضرورت ہے۔ براہ کرم دوبارہ کوشش کرنے سے پہلے لاگ آؤٹ کریں اور دوبارہ لاگ ان کریں۔"
      } else {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "اپ ڈیٹ ناکام",
        description: description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold">کھاتہ اور حفاظت</h1>
      </header>

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>پاس ورڈ تبدیل کریں</CardTitle>
            <CardDescription>اپنے اکاؤنٹ کے لیے نیا پاس ورڈ درج کریں۔</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نیا پاس ورڈ</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نئے پاس ورڈ کی تصدیق کریں</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  پاس ورڈ اپ ڈیٹ کریں
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
