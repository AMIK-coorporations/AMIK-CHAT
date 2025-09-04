import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/ai/flows/translate-text';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage = 'Urdu' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Handle very long texts
    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }

    // If text is already in Urdu/Arabic script, return as-is
    if (/[\u0600-\u06FF]/.test(text)) {
      return NextResponse.json({
        translatedText: text,
        sourceLanguage: 'Urdu',
        targetLanguage: 'Urdu',
        isAlreadyTranslated: true
      });
    }

    // Detect source language (basic detection)
    let detectedLanguage = 'Unknown';
    if (/^[a-zA-Z\s.,!?;:'"()-]+$/.test(text)) {
      detectedLanguage = 'English';
    } else if (/[\u4e00-\u9fff]/.test(text)) {
      detectedLanguage = 'Chinese';
    } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      detectedLanguage = 'Japanese';
    } else if (/[\uac00-\ud7af]/.test(text)) {
      detectedLanguage = 'Korean';
    } else if (/[\u0900-\u097f]/.test(text)) {
      detectedLanguage = 'Hindi';
    } else if (/[\u0e00-\u0e7f]/.test(text)) {
      detectedLanguage = 'Thai';
    }

    // Perform translation
    const result = await translateText({
      text: text.trim(),
      targetLanguage
    });

    if (!result?.translatedText) {
      return NextResponse.json(
        { error: 'Translation failed. Please try again.' },
        { status: 502 }
      );
    }

    // Return successful translation with metadata
    return NextResponse.json({
      translatedText: result.translatedText,
      sourceLanguage: detectedLanguage,
      targetLanguage: targetLanguage,
      originalLength: text.length,
      translatedLength: result.translatedText.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Translation API error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Translation request timed out. Please try again.' },
          { status: 408 }
        );
      }
      if (error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Network error. Please check your connection and try again.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
} 