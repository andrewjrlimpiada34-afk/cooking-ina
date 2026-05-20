
'use client';

import React, { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile } = useDoc(userDocRef);

  useEffect(() => {
    const theme = userProfile?.theme || 'default';
    document.documentElement.setAttribute('data-theme', theme);
  }, [userProfile?.theme]);

  return <>{children}</>;
}
