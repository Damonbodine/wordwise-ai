# WordWise AI Authentication Setup Guide

This guide will help you set up Supabase authentication with Google OAuth, proper RLS policies, and session management for WordWise AI.

## 🔧 Prerequisites

- Supabase account and project
- Google Cloud Console account (for OAuth)
- Node.js environment

## 📝 Step 1: Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the `Project URL` and `anon/public` key

## 🏗️ Step 2: Database Schema Setup

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Create a new query and paste the contents of `/supabase/migrations/001_initial_schema.sql`
4. Run the migration

This will create:
- User profiles table with RLS policies
- Documents table with proper security
- Collaboration system
- Usage tracking for subscriptions
- Automatic triggers for data consistency

## 🔐 Step 3: Google OAuth Setup

### 3.1 Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

### 3.2 Supabase OAuth Configuration

1. In your Supabase dashboard, go to "Authentication" → "Providers"
2. Enable Google provider
3. Enter your Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

## ⚙️ Step 4: Authentication Features

The authentication system includes:

### ✅ Implemented Features

- **Email/Password Authentication**: Secure sign up and sign in
- **Google OAuth**: One-click authentication with Google
- **Password Reset**: Secure password recovery via email
- **Session Management**: 1-hour session timeout as requested
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Profiles**: Automatic profile creation with preferences
- **Subscription Management**: Tier-based access control
- **Row Level Security**: Database-level security policies

### 🔒 Security Features

- **RLS Policies**: Users can only access their own data
- **Session Validation**: Automatic session refresh and validation
- **Secure Redirects**: Proper handling of OAuth callbacks
- **Error Handling**: Comprehensive error messages and recovery
- **CSRF Protection**: Built-in protection via Supabase

## 🚀 Step 5: Usage Examples

### Basic Authentication Check

```typescript
import { useAuthStore } from '@/stores/auth-store';

function MyComponent() {
  const { user, isLoading, signOut } = useAuthStore();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      Welcome, {user.email}!
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protected Route Usage

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route';

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  );
}

// Or with subscription requirement
function PremiumFeature() {
  return (
    <ProtectedRoute requireSubscription>
      <div>This content requires a paid subscription</div>
    </ProtectedRoute>
  );
}
```

### Manual Authentication

```typescript
import { useAuthStore } from '@/stores/auth-store';

function SignInForm() {
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();

  const handleEmailSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success) {
      // Redirect or show success
    } else {
      // Handle error
      console.error(result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    // OAuth redirect will handle the rest
  };

  return (
    <div>
      {/* Your form implementation */}
    </div>
  );
}
```

## 🧪 Step 6: Testing Authentication

### Test User Registration

1. Go to `/auth/signin`
2. Switch to "Sign Up" tab
3. Create a test account
4. Check your email for confirmation
5. Verify profile creation in Supabase dashboard

### Test Google OAuth

1. Click "Continue with Google" button
2. Complete Google OAuth flow
3. Verify automatic profile creation
4. Check that user data is properly stored

### Test Session Management

1. Sign in to the application
2. Wait for session timeout (or manually expire in browser storage)
3. Try to access protected content
4. Verify automatic redirect to sign-in

### Test RLS Policies

1. Create documents with different users
2. Verify users can only see their own documents
3. Test document sharing functionality
4. Confirm usage tracking is isolated per user

## 🔧 Step 7: Customization

### Subscription Limits

Modify subscription limits in `stores/auth-store.ts`:

```typescript
const getSubscriptionLimits = (tier: string): SubscriptionLimits => {
  switch (tier) {
    case 'pro':
      return {
        documentsPerMonth: 500,
        wordsPerMonth: 100000,
        // ... other limits
      };
    // ... other tiers
  }
};
```

### Session Timeout

Adjust session timeout in `lib/supabase.ts`:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    sessionTimeout: 60 * 60, // 1 hour in seconds
  },
});
```

### Theme and Styling

Customize authentication forms in `components/auth/auth-forms.tsx`:
- Update colors and styling
- Modify form validation rules
- Add additional fields
- Customize error messages

## ⚠️ Important Security Notes

1. **Never expose service role keys** in client-side code
2. **Always use RLS policies** for database access
3. **Validate user input** on both client and server
4. **Use HTTPS in production** for secure authentication
5. **Regularly update dependencies** for security patches
6. **Monitor authentication logs** for suspicious activity

## 🐛 Troubleshooting

### Common Issues

**"Invalid JWT" errors:**
- Check that environment variables are correct
- Verify Supabase project URL and keys
- Clear browser storage and try again

**Google OAuth not working:**
- Verify redirect URIs in Google Cloud Console
- Check that Google+ API is enabled
- Confirm OAuth credentials in Supabase

**RLS policy errors:**
- Verify user is authenticated before database operations
- Check that policies match your use cases
- Test policies with different user scenarios

**Session timeout issues:**
- Verify session timeout configuration
- Check for proper session refresh implementation
- Monitor network requests for auth token refresh

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 Next Steps

After setting up authentication:

1. **Test thoroughly** with different user scenarios
2. **Set up email templates** in Supabase for better user experience
3. **Implement subscription management** if using paid tiers
4. **Add analytics** to track authentication metrics
5. **Configure monitoring** for production environments

Your WordWise AI application now has enterprise-grade authentication with proper security, RLS policies, and subscription management! 