
"use client"

import React, { useState, useRef, useMemo } from 'react';
import { useUser, useFirestore, useAuth, useCollection } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Loader2, 
  User, 
  Mail, 
  Calendar, 
  Edit2, 
  Check, 
  Heart, 
  BookOpen, 
  ChefHat, 
  X, 
  Palette,
  Waves,
  Flame,
  Leaf
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DiaryFeed } from './diary-feed';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function ProfileView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats Queries
  const savedRecipesQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'savedRecipes');
  }, [firestore, user?.uid]);

  const diaryEntriesQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'diaryEntries'), where('userId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: savedRecipes } = useCollection(savedRecipesQuery);
  const { data: diaryEntries } = useCollection(diaryEntriesQuery);

  const stats = [
    { label: 'Recipes Saved', value: savedRecipes?.length || 0, icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Diary Entries', value: diaryEntries?.length || 0, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Kitchen Rank', value: 'Master', icon: ChefHat, color: 'text-accent', bg: 'bg-accent/5' },
  ];

  const themes = [
    { id: 'default', name: 'Forest Mint', icon: Leaf, color: 'bg-emerald-500' },
    { id: 'seafood', name: 'Seafood Blue', icon: Waves, color: 'bg-blue-500' },
    { id: 'grilled', name: 'Charred Grill', icon: Flame, color: 'bg-orange-600' },
  ];

  const handleThemeChange = (themeId: string) => {
    if (!firestore || !user?.uid) return;
    const userRef = doc(firestore, 'users', user.uid);
    
    updateDoc(userRef, { theme: themeId })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { theme: themeId },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Theme Updated",
      description: `Ambience changed to ${themeId}.`,
    });
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) throw new Error('Cloudinary config missing');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Failed to upload to Cloudinary');
    const data = await response.json();
    return data.secure_url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !auth?.currentUser || !firestore) return;

    setIsUploading(true);
    try {
      const photoURL = await uploadToCloudinary(file);
      await updateProfile(auth.currentUser, { photoURL });
      
      const userRef = doc(firestore, 'users', user.uid);
      updateDoc(userRef, { photoURL }).catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { photoURL },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
      
      toast({
        title: "Profile updated!",
        description: "Your new picture looks great, Chef!",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!user || !auth?.currentUser || !firestore || !newName.trim()) return;

    try {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      const userRef = doc(firestore, 'users', user.uid);
      updateDoc(userRef, { displayName: newName.trim() }).catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { displayName: newName.trim() },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
      setIsEditingName(false);
      toast({ title: "Name updated!" });
    } catch (error: any) {
      toast({ title: "Failed to update name", variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-500">
      <section className="glass p-6 sm:p-10 rounded-[32px] md:rounded-[48px] border-white/40 shadow-xl flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full -ml-16 -mb-16 blur-3xl" />
        
        <div className="relative group shrink-0">
          <Avatar className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 border-4 border-white shadow-2xl relative">
            <AvatarImage src={user.photoURL || ''} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl sm:text-5xl">
              <User className="w-16 h-16 sm:w-20 sm:h-20" />
            </AvatarFallback>
          </Avatar>
          
          <Button 
            size="icon" 
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg border-4 border-white transition-transform hover:scale-110 active:scale-95 h-10 w-10 sm:h-12 sm:w-12"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        <div className="flex-grow space-y-6 text-center md:text-left w-full">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="h-12 text-lg sm:text-xl font-bold bg-white/50 border-primary/20 rounded-xl"
                    autoFocus
                  />
                  <Button size="icon" className="h-12 w-12 rounded-xl bg-accent hover:bg-accent/90 shrink-0" onClick={handleNameUpdate}>
                    <Check className="w-6 h-6" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl shrink-0" onClick={() => setIsEditingName(false)}>
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">{user.displayName || 'Anonymous Chef'}</h3>
                  <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all rounded-full" onClick={() => setIsEditingName(true)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-muted-foreground text-sm sm:text-base">
              <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary/60" /> {user.email}</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary/60" /> Joined {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Long ago'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">Expert Cook</Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">Taste Maker</Badge>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 px-1">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-[24px] sm:rounded-[32px] border-white/40 shadow-lg flex items-center gap-4 group hover:scale-[1.02] transition-all">
            <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-6 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Palette className="w-5 h-5" />
          </div>
          <h4 className="text-xl font-bold">Kitchen Ambience</h4>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={cn(
                "glass p-6 rounded-3xl border-white/40 text-left transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
              )}
            >
              <div className="flex flex-col gap-4 relative z-10">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform", t.color)}>
                  <t.icon className="w-5 h-5" />
                </div>
                <span className="font-bold">{t.name}</span>
              </div>
              <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 opacity-5 blur-2xl rounded-full", t.color)} />
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-8 px-1">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-2xl sm:text-3xl font-bold text-primary">Cooking Gallery</h4>
            <p className="text-sm sm:text-base text-muted-foreground">Your shared culinary achievements and memories</p>
          </div>
        </div>
        <DiaryFeed userId={user.uid} />
      </section>
    </div>
  );
}
