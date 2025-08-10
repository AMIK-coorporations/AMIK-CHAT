
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { suggestContacts, type SuggestContactsOutput } from "@/ai/flows/suggest-contacts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useToast } from "@/hooks/use-toast";

const initialState: SuggestContactsOutput = {
  suggestedContacts: [],
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      رابطے تجویز کریں
    </Button>
  );
}

export default function ContactSuggestions() {
  const [state, setState] = useState<SuggestContactsOutput>(initialState);
  const { toast } = useToast();

  const handleFormSubmit = async (formData: FormData) => {
    const profileInformation = formData.get('profileInformation') as string;
    const communicationPatterns = formData.get('communicationPatterns') as string;

    if (!profileInformation || !communicationPatterns) {
        toast({
            variant: "destructive",
            title: "فارم نامکمل ہے",
            description: "براہ کرم تمام فیلڈز کو پُر کریں۔"
        });
        return;
    }

    try {
        const result = await suggestContacts({ profileInformation, communicationPatterns });
        setState(result);
    } catch (error) {
        console.error("Error suggesting contacts:", error);
        toast({
            variant: "destructive",
            title: "تجویز میں خرابی",
            description: "رابطوں کی تجویز حاصل کرتے وقت ایک خرابی پیش آگئی۔"
        });
        setState(initialState); // Reset on error
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>اسمارٹ رابطے کی تجاویز</CardTitle>
        <CardDescription>
          AI کو اپنی پروفائل اور مواصلاتی نمونوں کی بنیاد پر نئے رابطے تجویز کرنے دیں۔
        </CardDescription>
      </CardHeader>
      <form action={handleFormSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileInformation">آپ کی پروفائل کی معلومات</Label>
            <Textarea
              id="profileInformation"
              name="profileInformation"
              placeholder="مثال کے طور پر، Acme Inc. میں سافٹ ویئر انجینئر۔ AI اور ویب ڈویلپمنٹ میں دلچسپی۔"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="communicationPatterns">آپ کے مواصلاتی نمونے</Label>
            <Textarea
              id="communicationPatterns"
              name="communicationPatterns"
              placeholder="مثال کے طور پر، ڈیزائن ٹیم اور پروجیکٹ مینیجرز کے ساتھ اکثر چیٹ کریں۔ اکثر پروجیکٹ کی آخری تاریخوں اور فیچر کے نفاذ پر تبادلہ خیال کریں۔"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4">
           <p className="text-sm text-muted-foreground">جینیٹک اے آئی سے تقویت یافتہ</p>
          <SubmitButton />
        </CardFooter>
      </form>
      
      {state.suggestedContacts && state.suggestedContacts.length > 0 && (
         <CardContent>
            <Alert>
              <Wand2 className="h-4 w-4" />
              <AlertTitle>یہاں کچھ تجاویز ہیں!</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {state.suggestedContacts.map((contact, index) => (
                    <li key={index}>{contact}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
         </CardContent>
      )}
    </Card>
  );
}
