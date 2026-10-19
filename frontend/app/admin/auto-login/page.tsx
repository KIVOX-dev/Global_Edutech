'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

export default function AdminAutoLogin() {
  const [status, setStatus] = useState('Authenticating...');
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page if in production
    if (!isDev) {
      setStatus('Auto-login is not available in production. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
      return;
    }

    async function performLogin() {
      try {
        setStatus('Attempting automatic login...');
        
        const response = await fetch('/api/admin/auto-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (isDev) console.log('Auto-login response status:', response.status);
        
        if (!response.ok) {
          setStatus('Login failed. Redirecting to login page...');
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 2000);
          return;
        }
        
        setStatus('Login successful! Redirecting to dashboard...');
        
        // Delay redirect to ensure cookie is set
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1000);
      } catch (error) {
        if (isDev) console.error('Auto-login error:', error);
        setStatus('Login error. Redirecting to login page...');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      }
    }
    
    performLogin();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-pulse mb-4">
        <div className="h-12 w-12 bg-indigo-600 rounded-full"></div>
      </div>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Admin Access</h1>
      <p className="text-gray-600">{status}</p>
    </div>
  );
}
