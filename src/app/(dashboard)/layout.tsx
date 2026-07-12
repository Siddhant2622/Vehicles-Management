"use client";

import { useEffect } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function ScopedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const syncWithSupabase = useTransitStore((state) => state.syncWithSupabase);

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-[#fcfbfa] text-slate-800 dark:text-slate-200 transition-colors duration-200">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-[#fcfbfa] p-6 scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
