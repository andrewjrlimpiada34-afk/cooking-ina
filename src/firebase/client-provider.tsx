'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Terminal } from 'lucide-react';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const services = useMemo(() => initializeFirebase(), []);

  // If configuration is missing, show a helpful setup guide instead of crashing
  if (!services.firebaseApp || !services.auth || !services.firestore) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive" className="border-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Firebase Setup Required</AlertTitle>
            <AlertDescription>
              Your Firebase configuration is missing or invalid.
            </AlertDescription>
          </Alert>
          
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Next Steps:
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal ml-4">
              <li>Open your <code>.env</code> file in the project root.</li>
              <li>Add your Firebase keys from the Firebase Console (Project Settings).</li>
              <li>Ensure they start with <code>NEXT_PUBLIC_FIREBASE_</code>.</li>
              <li>Restart the development server.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider 
      firebaseApp={services.firebaseApp} 
      firestore={services.firestore} 
      auth={services.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
