
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { search, type SearchOutput } from '@/ai/flows/search-flow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, Search as SearchIcon, Wand2, Link2, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const suggestedQueries = [
    'پاکستان کی تاریخ',
    'آج موسم کیسا ہے؟',
    'صحت مند رہنے کے 5 طریقے',
    'ایک دلچسپ لطیفہ سنائیں',
];

const LoadingDots = () => (
    <div className="flex space-x-2 justify-center items-center">
      <span className="sr-only">لوڈ ہو رہا ہے...</span>
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div>
    </div>
  );

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await search({ query: searchQuery });
      setResult(response);
    } catch (err) {
      console.error("Error during AI search:", err);
      setError("کچھ غلط ہو گیا. براہ مہربانی دوبارہ کوشش کریں.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  }

  const getHostnameFromUrl = (url: string) => {
    try {
        // Handle URLs that might not have a protocol
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        return new URL(url).hostname.replace('www.', '');
    } catch (e) {
        // Fallback for malformed URLs
        return url.split('/')[0] || url;
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold">اے ایم آئی کے تلاش</h1>
      </header>
      
      <div className="p-4 space-y-6">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <Input 
            dir="rtl"
            placeholder="کچھ بھی تلاش کریں..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-base h-11 text-right"
          />
          <Button type="submit" size="icon" className="h-11 w-11" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
          </Button>
        </form>

        <div className="min-h-[60vh] flex flex-col">
            {loading && (
                <div className="flex flex-col items-center justify-center text-muted-foreground pt-16 space-y-4">
                    <LoadingDots />
                    <p className="text-lg">تلاش کیا جا رہا ہے...</p>
                    <p className="text-sm">آپ کے لیے بہترین جواب تیار کیا جا رہا ہے۔</p>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                  <AlertTitle>خرابی</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
              <div className="space-y-8 animate-in fade-in-50">
                <Card className="shadow-lg border-primary/20 bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-primary">
                            <Wand2 className="h-6 w-6" />
                            <span className='text-2xl'>اے ایم آئی کے کا جواب</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div dir="rtl" className="text-right text-base space-y-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:pl-0 [&_li]:mb-1 [&_strong]:font-semibold">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>

                {result.sources && result.sources.length > 0 && (
                  <div className="space-y-4">
                     <h3 className="text-2xl font-bold border-b pb-2 mb-4 flex items-center gap-2">
                        <Globe className="h-6 w-6 text-muted-foreground" />
                        ویب کے نتائج
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {result.sources.map((source, index) => (
                          <a 
                            key={index} 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block group"
                          >
                            <Card className="hover:border-primary/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                   <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                   <p className="text-sm text-green-700 dark:text-green-500 truncate">{getHostnameFromUrl(source.url)}</p>
                                </div>
                                <h4 dir="rtl" className="text-right text-primary text-lg font-medium group-hover:underline mt-1">{source.title}</h4>
                                <p dir="rtl" className="text-right mt-2 text-sm text-card-foreground/80">{source.snippet}</p>
                              </CardContent>
                            </Card>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !result && !error && (
                 <div className="text-center text-muted-foreground pt-10">
                    <div className="inline-block p-4 bg-primary/10 rounded-full">
                        <SearchIcon className="h-12 w-12 mx-auto text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mt-6 mb-2">کچھ بھی پوچھیں</h2>
                    <p className="mb-6">مصنوعی ذہانت سے فوری جواب حاصل کرنے کے لیے اپنا سوال اوپر درج کریں۔</p>
                    <div className='flex flex-wrap justify-center gap-2'>
                        {suggestedQueries.map(q => (
                            <Button key={q} variant="outline" size="sm" onClick={() => handleSearch(q)}>
                                {q}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
