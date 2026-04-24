# Supabase Authentication Fix Guide

## Problem
Users getting "Network error. Please check your internet connection and try again." when trying to sign up.

## Root Cause
1. Email confirmation is enabled in Supabase (default)
2. Redirect URLs need to be whitelisted
3. Preview environment URLs may not be configured

## Solution Options

### Option 1: Disable Email Confirmation (Quickest - Recommended for Testing)

1. Go to your Supabase Dashboard: https://app.supabase.com/project/lfpwqhafnnrhgxjdpqvf
2. Click **Authentication** → **Providers** → **Email**
3. Toggle **OFF** "Confirm email"
4. Click **Save**

Now users can sign up and log in immediately without email verification!

### Option 2: Add Preview URL to Allowed Redirect URLs

1. Go to Supabase Dashboard: https://app.supabase.com/project/lfpwqhafnnrhgxjdpqvf
2. Click **Authentication** → **URL Configuration**
3. In "Redirect URLs", add:
   ```
   https://3000-4e2ea017-e05c-4633-85c4-6921480ba6ed.softgen.dev/auth/confirm-email
   https://*/auth/confirm-email
   http://localhost:3000/auth/confirm-email
   ```
4. Click **Save**

### Option 3: Use Admin Signup (Built-in Workaround)

The app now includes an admin signup endpoint that bypasses email confirmation:

1. Try to sign up normally
2. If you see network error, a new button appears: "Use Admin Signup"
3. Click it to create account without email verification
4. You can immediately log in

## Testing Login

After applying **Option 1** or **Option 3**:

1. Go to `/dashboard`
2. Click "Sign Up" tab
3. Enter:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: test123456
   - Confirm Password: test123456
4. Click "Create Account"
5. Switch to "Login" tab
6. Enter same email/password
7. Click "Sign In"
8. ✅ Should work!

## Current Setup

Your Supabase project credentials are already configured in `.env.local`:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
- ✅ SUPABASE_SERVICE_ROLE_KEY

## Recommended: Disable Email Confirmation

For the best user experience during development, **use Option 1** (disable email confirmation). You can always re-enable it later when you're ready to go live.