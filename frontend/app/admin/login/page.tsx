'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// Component to handle search params inside Suspense boundary
function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/admin/dashboard';
  
  // Check if credentials are in URL parameters (for development use only)
  useEffect(() => {
    const urlUsername = searchParams?.get('username');
    const urlPassword = searchParams?.get('password');
    
    if (urlUsername) {
      setUsername(urlUsername);
    }
    
    if (urlPassword) {
      setPassword(urlPassword);
    }
    
    // Auto-submit if both username and password are provided in URL
    if (urlUsername && urlPassword) {
      if (isDev) console.log('Auto-submitting login from URL parameters');
      const timer = setTimeout(() => {
        handleSubmit(new Event('submit') as any);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    
    if (loading) return;
    
    setError('');
    setLoading(true);
    
    try {
      if (isDev) console.log('Submitting login with:', { username });
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        // Ensure credentials are included
        credentials: 'include',
      });
      
      if (isDev) console.log('Login response status:', response.status);
      
      // Get the response data regardless of status
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      // Delay the redirect slightly to ensure cookie is set
      setTimeout(() => {
        if (isDev) console.log('Redirecting to:', redirectTo);
        // Use window.location instead of router.push to force a full page reload
        // This ensures the cookie is properly processed by the middleware
        window.location.href = redirectTo;
      }, 1000);
    } catch (err: any) {
      if (isDev) console.error('Login error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/">
            <img
              className="mx-auto h-12 w-auto"
              src="/images/logo.png"
              alt="Global Edutech Logo"
            />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center">
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500">
              Return to Homepage
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Loading fallback component for Suspense
function LoginLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Loading...
          </h2>
        </div>
      </div>
    </div>
  );
}

// Main page component that wraps the form in Suspense
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoader />}>
      <LoginForm />
    </Suspense>
  );
}
