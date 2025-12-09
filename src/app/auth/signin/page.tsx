'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SignInPage() {
  const [authMode, setAuthMode] = useState<'microsoft' | 'credentials'>('microsoft');
  const [empCode, setEmpCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signIn('azure-ad', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Failed to sign in with Microsoft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username: empCode,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid Employee Code or Password');
      } else if (result?.ok) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">TRTH</h1>
          <p className="text-gray-600">Employee Assessment System</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setAuthMode('microsoft')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              authMode === 'microsoft'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Permanent Staff
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('credentials')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              authMode === 'credentials'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Temporary Staff
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Microsoft Sign In */}
        {authMode === 'microsoft' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Sign in with your @trth.co.th email account
            </p>
            <Button
              onClick={handleMicrosoftSignIn}
              disabled={isLoading}
              className="w-full bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                    <path d="M0 0h11v11H0z" fill="#f25022" />
                    <path d="M12 0h11v11H12z" fill="#00a4ef" />
                    <path d="M0 12h11v11H0z" fill="#7fba00" />
                    <path d="M12 12h11v11H12z" fill="#ffb900" />
                  </svg>
                  Sign in with Microsoft
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Credentials Sign In */}
        {authMode === 'credentials' && (
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="empCode" className="text-sm font-medium text-gray-700">
                Employee Code
              </label>
              <Input
                id="empCode"
                type="text"
                placeholder="e.g., EMP001"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="DDMMYYYY (Join Date)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                maxLength={8}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Enter your join date in DDMMYYYY format (e.g., 01012024)
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !empCode || !password}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        )}

        {/* Help Text */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {authMode === 'microsoft' ? (
              <>
                Temporary staff? Switch to <strong>Temporary Staff</strong> tab above
              </>
            ) : (
              <>
                Permanent staff? Switch to <strong>Permanent Staff</strong> tab above
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            Need help? Contact HR at <a href="mailto:hr@trth.co.th" className="text-blue-600 hover:underline">hr@trth.co.th</a>
          </p>
        </div>
      </Card>
    </div>
  );
}
