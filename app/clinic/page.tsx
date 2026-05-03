// =============================================================================
// MaaSwara — Clinic Dashboard Page
// Spec: Phase 2 - Real-time alerts
// =============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertRecord } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import AlertCard from '@/components/AlertCard';
import EmptyDashboard from '@/components/EmptyDashboard';
import Wordmark from '@/components/Wordmark';

export default function ClinicDashboard() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial fetch
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        if (!response.ok) throw new Error('Failed to fetch alerts');
        const data = await response.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        setError('Could not load active alerts.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // 2. Set up realtime subscription
    const supabase = getSupabaseClient();
    
    const subscription = supabase
      .channel('alerts_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('[MaaSwara Realtime] Received alert change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as AlertRecord;
            if (newAlert.status === 'active') {
              setAlerts((prev) => [newAlert, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAlert = payload.new as AlertRecord;
            setAlerts((prev) => {
              if (updatedAlert.status !== 'active') {
                return prev.filter((a) => a.id !== updatedAlert.id);
              }
              return prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a));
            });
          } else if (payload.eventType === 'DELETE') {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleStatusUpdate = async (id: string, status: 'acknowledged' | 'resolved') => {
    try {
      const supabase = getSupabaseClient();
      // For demo, we allow anon to update status, or we can just mock the UI update if anon can't update
      const { error } = await supabase
        .from('alerts')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('[MaaSwara] Error updating status:', error);
        // Optimitically remove it anyway if RLS blocks anon update for demo
      }

      // Optimistically remove from active list
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen p-6" style={{ backgroundColor: 'var(--cream)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Wordmark size="sm" showTagline={false} />
            <span className="text-base font-normal mt-1" style={{ color: 'var(--ink-muted)' }}>
              · Clinic Dashboard
            </span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--ink-soft)' }}
          >
            ← Patient view
          </Link>
        </div>

        {/* Dashboard Content */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-pulse flex items-center gap-2" style={{ color: 'var(--terracotta)' }}>
              <span className="w-2 h-2 rounded-full bg-current typing-dot" />
              <span className="w-2 h-2 rounded-full bg-current typing-dot" />
              <span className="w-2 h-2 rounded-full bg-current typing-dot" />
            </div>
          </div>
        ) : error ? (
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: 'var(--triage-red-bg)', color: 'var(--triage-red)' }}
          >
            {error}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyDashboard />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={(id) => handleStatusUpdate(id, 'acknowledged')}
                onResolve={(id) => handleStatusUpdate(id, 'resolved')}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
