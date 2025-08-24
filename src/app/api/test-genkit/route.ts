import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function GET() {
  try {
    console.log('Testing genkit configuration...');
    console.log('AI object:', ai);
    console.log('AI.definePrompt exists:', !!ai.definePrompt);
    console.log('AI.defineFlow exists:', !!ai.defineFlow);
    
    // Test if genkit is properly configured
    const isConfigured = ai.definePrompt && ai.defineFlow;
    
    return NextResponse.json({
      success: true,
      isConfigured,
      hasDefinePrompt: !!ai.definePrompt,
      hasDefineFlow: !!ai.defineFlow,
      aiObject: typeof ai,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Genkit test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 