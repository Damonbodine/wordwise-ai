#!/bin/bash

# Deploy Supabase Edge Functions with environment variables

echo "🚀 Deploying Supabase Edge Functions..."

# Deploy the analyze-text function
echo "📦 Deploying analyze-text function..."
supabase functions deploy analyze-text

# Set the Groq API key as a secret (this keeps it secure)
echo "🔐 Setting environment secrets..."
echo "⚠️  Please manually set your Groq API key:"
echo "echo 'your_groq_api_key_here' | supabase secrets set GROQ_API_KEY"

echo "✅ Deployment complete!"
echo ""
echo "To test the function locally:"
echo "supabase functions serve analyze-text --env-file supabase/.env.local"