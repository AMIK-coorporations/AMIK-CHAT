"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestTranslationPage() {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testTranslation = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Detect if text is in English or Urdu
      const isEnglish = /[a-zA-Z]/.test(text);
      const targetLanguage = isEnglish ? 'Urdu' : 'English';
      
      console.log('Testing translation:', { text, targetLanguage });
      
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const result = await res.json();
      console.log('Translation result:', result);
      
      if (result.translatedText) {
        setTranslation(result.translatedText);
      } else {
        throw new Error('No translation received');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      setError(error.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Translation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Text to Translate:</label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text in English or Urdu..."
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={testTranslation} 
            disabled={!text.trim() || loading}
            className="w-full"
          >
            {loading ? 'Translating...' : 'Translate'}
          </Button>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          
          {translation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-medium text-green-800 mb-2">Translation:</h3>
              <p className="text-green-700">{translation}</p>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <h4 className="font-medium mb-2">Test Examples:</h4>
            <ul className="space-y-1">
              <li>• English: "hello" → Urdu</li>
              <li>• English: "who are you" → Urdu</li>
              <li>• Urdu: "اسلم و علیکم" → English</li>
              <li>• Urdu: "کیو آراے ایم آئی کے برقی خط" → English</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 