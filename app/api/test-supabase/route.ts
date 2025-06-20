import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('[TEST] Testing Supabase connection...');
    
    // Test 1: Basic client health
    const isHealthy = !!supabase;
    console.log('[TEST] Supabase client exists:', isHealthy);
    
    // Test 2: Simple query that doesn't require auth
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .limit(1);
    
    console.log('[TEST] Query result:', { data, error });
    
    // Test 3: Auth session check
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('[TEST] Session check:', { sessionData, sessionError });
    
    return NextResponse.json({
      success: true,
      clientExists: isHealthy,
      queryResult: { data, error },
      sessionResult: { sessionData, sessionError },
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      }
    });
  } catch (error: any) {
    console.error('[TEST] Supabase test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}