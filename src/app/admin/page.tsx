
"use client"

import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  Megaphone, 
  Star, 
  Trash2, 
  Plus, 
  Loader2, 
  ArrowLeft,
  Image as ImageIcon,
  Check,
  X,
  Calendar,
  Search
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy, 
  updateDoc,
  limit
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const ADMIN_EMAIL = "cookinginaniyonglahat@gmail.com";

export default function AdminPortal() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [announcement, setAnnouncement] = useState('');
  const [choiceDesc, setChoiceDesc] = useState('');
  const [choiceImg, setChoiceImg] = useState<File | null>(null);
  const [choicePreview, setChoicePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Admin Check via Firestore
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  // Firestore Queries
  const announcementsQuery = React.useMemo(() => firestore ? query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const developersChoiceQuery = React.useMemo(() => firestore ? query(collection(firestore, 'developersChoice'), orderBy('createdAt', 'desc'), limit(5)) : null, [firestore]);
  const usersQuery = React.useMemo(() => firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const { data: announcements = [] } = useCollection(announcementsQuery);
  const { data: choices = [] } = useCollection(developersChoiceQuery);
  const { data: community = [] } = useCollection(usersQuery);

  const filteredUsers = community.filter((u: any) => 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  React.useEffect(() => {
    if (!userLoading && !profileLoading && (!user || (user.email !== ADMIN_EMAIL && userProfile?.isAdmin !== true))) {
      router.push('/dashboard');
    }
  }, [user, userLoading, profileLoading, userProfile, router]);

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary config missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload to Cloudinary');
    const data = await response.json();
    return data.secure_url;
  };

  const handleAnnouncement = () => {
    if (!announcement.trim() || !firestore) return;
    setIsSubmitting(true);
    
    const collectionRef = collection(firestore, 'announcements');
    const data = {
      message: announcement.trim(),
      createdAt: serverTimestamp(),
      active: true
    };

    addDoc(collectionRef, data)
      .catch(async (e) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

    setAnnouncement('');
    toast({ title: "Broadcast Live!", description: "Users will be notified by Andrew's Pan." });
    setIsSubmitting(false);
  };

  const handleChoiceUpload = async () => {
    if (!choiceDesc.trim() || !choiceImg || !firestore) return;
    setIsSubmitting(true);
    try {
      const url = await uploadToCloudinary(choiceImg);
      const collectionRef = collection(firestore, 'developersChoice');
      const data = {
        description: choiceDesc.trim(),
        imageUrl: url,
        imageHint: choiceDesc.trim().split(' ').slice(0, 2).join(' '),
        createdAt: serverTimestamp()
      };

      addDoc(collectionRef, data)
        .catch(async (e) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: data,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });

      setChoiceDesc('');
      setChoiceImg(null);
      setChoicePreview(null);
      toast({ title: "Featured!", description: "Dish added to landing carousel." });
    } catch (e) {
      toast({ title: "Upload Failed", variant: "destructive", description: "Check your Cloudinary environment variables." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAnnouncement = (id: string, active: boolean) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'announcements', id);
    updateDoc(docRef, { active: !active })
      .catch(async (e) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { active: !active },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deleteItem = (colName: string, id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, colName, id);
    deleteDoc(docRef)
      .catch(async (e) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    toast({ title: "Item Removed" });
  };

  const toggleUserAdmin = (uid: string, currentStatus: boolean) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', uid);
    updateDoc(userRef, { isAdmin: !currentStatus }).catch(async () => {
       toast({ title: "Permission Error", variant: "destructive" });
    });
  };

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <nav className="border-b glass shrink-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
            </Button>
            <div className="p-1.5 sm:p-2 bg-primary rounded-xl">
              <ShieldCheck className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-base sm:text-xl font-bold text-primary truncate max-w-[150px] sm:max-w-none">Admin Center</h1>
          </div>
          <Badge variant="outline" className="border-primary text-primary font-bold hidden sm:inline-flex">Enterprise Admin</Badge>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12">
        <div className="container mx-auto space-y-10 md:space-y-12">
          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/5 p-1 mb-6 sm:mb-10">
              <TabsTrigger value="announcements" className="rounded-lg sm:rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
                <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Broadcast
              </TabsTrigger>
              <TabsTrigger value="carousel" className="rounded-lg sm:rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Carousel
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg sm:rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Community
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
              <Card className="glass border-white/40 shadow-xl rounded-[24px] sm:rounded-[32px]">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Global Broadcast</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Push real-time messages to all active chefs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="What's cooking, chefs? Enterprise-wide updates go here..." 
                    className="rounded-xl bg-white/50 min-h-[100px]"
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                  />
                  <Button 
                    onClick={handleAnnouncement} 
                    disabled={isSubmitting || !announcement.trim()}
                    className="w-full rounded-xl bg-accent hover:bg-accent/90 text-white gap-2 h-12 font-bold"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                    Broadcast Now
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:gap-4">
                <h3 className="font-bold text-lg text-primary px-1">Broadcast Logs</h3>
                {announcements.map((a: any) => (
                  <div key={a.id} className="glass p-4 sm:p-5 rounded-2xl border-white/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                    <div className="space-y-1">
                      <p className="font-medium text-sm sm:text-base">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground">{a.createdAt?.toDate().toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={a.active ? "default" : "outline"} 
                        className="rounded-lg h-8 flex-1 sm:flex-none"
                        onClick={() => toggleAnnouncement(a.id, a.active)}
                      >
                        {a.active ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                        {a.active ? "Active" : "Archived"}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteItem('announcements', a.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="carousel" className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
              <Card className="glass border-white/40 shadow-xl rounded-[24px] sm:rounded-[32px]">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Manage Spotlight (Max 5)</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Manage the high-visibility carousel on the landing page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div 
                    className="relative h-40 sm:h-48 border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {choicePreview ? (
                      <img src={choicePreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary/20 mb-2" />
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Click to upload spotlight photo</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setChoiceImg(f);
                          const r = new FileReader();
                          r.onload = () => setChoicePreview(r.result as string);
                          r.readAsDataURL(f);
                        }
                      }} 
                    />
                  </div>
                  <Input 
                    placeholder="Spotlight Dish Name" 
                    className="rounded-xl h-12"
                    value={choiceDesc}
                    onChange={(e) => setChoiceDesc(e.target.value)}
                  />
                  <Button 
                    onClick={handleChoiceUpload} 
                    disabled={isSubmitting || !choiceImg || !choiceDesc.trim() || choices.length >= 5}
                    className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 h-12 font-bold"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {choices.length >= 5 ? "Spotlight Full (Max 5)" : "Add to Spotlight"}
                  </Button>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {choices.map((c: any) => (
                  <div key={c.id} className="glass rounded-2xl sm:rounded-3xl overflow-hidden border-white/40 shadow-lg relative group h-56 sm:h-64">
                    <img src={c.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={c.description} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="text-white font-bold text-xs sm:text-sm pr-2 truncate">{c.description}</span>
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8 rounded-lg shrink-0"
                        onClick={() => deleteItem('developersChoice', c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 animate-in fade-in duration-500">
              <Card className="glass border-white/40 shadow-xl rounded-[24px] sm:rounded-[32px]">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Kitchen Community</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Manage and monitor all signed-in chefs.</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search chefs..." 
                        className="pl-9 h-10 rounded-xl"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:gap-4">
                    {filteredUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 sm:p-4 bg-white/50 rounded-2xl border border-white/30 hover:bg-white transition-all">
                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner overflow-hidden">
                            {u.photoURL ? <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : (u.displayName?.[0] || 'U')}
                          </div>
                          <div className="overflow-hidden space-y-0.5">
                            <p className="font-bold text-sm sm:text-base truncate">{u.displayName || 'Anonymous Chef'}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{u.email}</p>
                            {u.createdAt && (
                              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-primary/60">
                                <Calendar className="w-3 h-3" />
                                <span>Joined {u.createdAt.toDate().toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                           <Button 
                            variant={u.isAdmin ? "default" : "outline"} 
                            size="sm" 
                            className="text-[10px] h-7 px-2"
                            onClick={() => toggleUserAdmin(u.uid, u.isAdmin)}
                           >
                             {u.isAdmin ? "Remove Admin" : "Make Admin"}
                           </Button>
                           <Badge variant={u.isAdmin ? "default" : "secondary"} className={u.isAdmin ? "bg-accent" : "bg-primary/5 text-primary"}>
                            {u.isAdmin ? "Head Chef" : "Chef"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        {userSearch ? "No matching chefs found." : "No chefs found in the database yet."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
