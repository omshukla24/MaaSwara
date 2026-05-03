'use client';

import { useActionState } from 'react';
import { loginAsProvider } from './actions';
import Wordmark from '@/components/Wordmark';

export default function ClinicLoginPage() {
  const [state, formAction, pending] = useActionState(loginAsProvider, undefined);

  return (
    <main className="min-h-screen warm-gradient flex items-center justify-center p-6">
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        style={{ border: '1px solid var(--line-soft)' }}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Wordmark size="md" showTagline={false} />
          </div>
          <h1 className="font-display text-2xl font-semibold mt-2" style={{ color: 'var(--ink)' }}>
            Provider Portal
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            Please enter your clinic access credentials to view live triage alerts.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="text-sm font-medium block"
              style={{ color: 'var(--ink-soft)' }}
            >
              Access Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              disabled={pending}
              className="w-full px-4 py-3 rounded-xl border outline-none transition-colors"
              style={{ 
                borderColor: 'var(--line)', 
                backgroundColor: 'var(--cream)',
                color: 'var(--ink)'
              }}
              placeholder="Enter password..."
            />
          </div>

          {state?.error && (
            <div className="p-3 rounded-lg text-sm text-center" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 rounded-xl font-medium transition-all duration-200 flex justify-center items-center"
            style={{ 
              backgroundColor: 'var(--terracotta)', 
              color: 'var(--ivory)',
              opacity: pending ? 0.7 : 1,
              transform: pending ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            {pending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Secure Login'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--line-soft)' }}>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            For emergency demonstration access, use the demo password. <br />
            Protected by MaaSwara Protocol.
          </p>
        </div>
      </div>
    </main>
  );
}
