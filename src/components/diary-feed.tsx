
"use client"

import React from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Clock, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface DiaryFeedProps {
  userId?: string;
}

export function DiaryFeed({ userId }: DiaryFeedProps) {
  const firestore = useFirestore();
  
  const diaryQuery = React.useMemo(() => {
    if (!firestore) return null;
    
    const baseQuery = collection(firestore, 'diaryEntries');
    
    if (userId) {
      return query(
        baseQuery,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    return query(
      baseQuery,
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: entries = [], loading } = useCollection(diaryQuery);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 bg-muted rounded-[32px]" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-[32px] border-dashed border-2 border-primary/10">
        <p className="text-muted-foreground">
          {userId ? "You haven't shared any memories yet. Start cooking!" : "The diary is empty. Be the first to share a memory!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {entries.map((entry: any) => (
        <div key={entry.id} className="glass rounded-[32px] overflow-hidden border-white/40 shadow-xl hover:shadow-2xl transition-all group flex flex-col h-full">
          <div className="relative h-64 flex-shrink-0">
            <img 
              src={entry.imageUrl} 
              alt={entry.caption} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-white/80 backdrop-blur-md text-primary hover:bg-white">
                <Heart className="w-3 h-3 mr-1 text-red-500 fill-red-500" />
                Community
              </Badge>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-grow flex flex-col">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-primary/10">
                <AvatarImage src={entry.userPhoto} className="object-cover" />
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">{entry.userName}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {entry.createdAt ? formatDistanceToNow(entry.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </div>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed italic flex-grow">
              "{entry.caption}"
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
