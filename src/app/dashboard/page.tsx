"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, 
  Flame, 
  LayoutDashboard, 
  Heart, 
  TrendingUp,
  ArrowRight,
  Loader2,
  LogOut,
  Youtube,
  Lightbulb,
  Menu,
  X,
  BookOpen,
  Plus,
  User as UserIcon,
  ShieldCheck,
  Scan
} from 'lucide-react';
import { IngredientTracker } from '@/components/ingredient-tracker';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeDetailsModal } from '@/components/recipe-details-modal';
import { DiaryUploadModal } from '@/components/diary-upload-modal';
import { IngredientScannerModal } from '@/components/ingredient-scanner-modal';
import { DiaryFeed } from '@/components/diary-feed';
import { ProfileView } from '@/components/profile-view';
import { Button } from '@/components/ui/button';
import { generateRecipes } from '@/ai/flows/recipe-generator-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useAuth, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ADMIN_EMAIL = "cookinginaniyonglahat@gmail.com";

interface Recipe {
  name: string;
  matchPercentage: number;
  ingredientsRequired: string[];
  missingIngredients: string[];
  instructions: string[];
  estimatedTimeMinutes: number;
}

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState('discovery');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // Persistence: Navigation Tab
  useEffect(() => {
    const savedTab = typeof window !== 'undefined' ? localStorage.getItem('cookingIna_activeTab') : null;
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookingIna_activeTab', activeTab);
    }
  }, [activeTab]);

  // Firestore Sync: User Profile
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  // Enterprise Registration: Auto-save user to Firestore on sign-in
  useEffect(() => {
    if (!userLoading && !profileLoading && user && !userProfile && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      const initialData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Chef',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        ingredients: [],
        theme: 'default',
        isAdmin: user.email === ADMIN_EMAIL
      };

      setDoc(userRef, initialData, { merge: true }).catch(async (e) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: initialData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    }
  }, [user, userLoading, userProfile, profileLoading, firestore]);

  const isAdmin = user?.email === ADMIN_EMAIL || userProfile?.isAdmin === true;

  useEffect(() => {
    if (userProfile?.ingredients) {
      setIngredients(userProfile.ingredients);
    }
  }, [userProfile?.ingredients]);

  const handleIngredientsChange = useCallback((newIngredients: string[]) => {
    if (!firestore || !user?.uid) return;
    
    setIngredients(newIngredients);

    const userRef = doc(firestore, 'users', user.uid);
    updateDoc(userRef, { ingredients: newIngredients }).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: { ingredients: newIngredients },
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  }, [firestore, user?.uid]);

  const handleScannerResults = (scanned: string[]) => {
    const combined = Array.from(new Set([...ingredients, ...scanned]));
    handleIngredientsChange(combined);
  };

  // Firestore Sync: Saved Recipes (Vault)
  const savedRecipesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'savedRecipes');
  }, [firestore, user?.uid]);

  const { data: savedRecipes = [] } = useCollection(savedRecipesQuery);
  const favorites = useMemo(() => savedRecipes.map((r: any) => r.name), [savedRecipes]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "Pantry empty!",
        description: "Please add at least one ingredient to start discovering.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateRecipes({ ingredients });
      setRecipes(result.recipes);
      toast({
        title: "Menu Prepared!",
        description: `Spoonacular found ${result.recipes.length} dishes for your pantry.`,
      });
    } catch (error) {
      toast({
        title: "Culinary Hiccup",
        description: "Failed to connect to the recipe engine.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFavorite = (recipe: Recipe) => {
    if (!firestore || !user?.uid) return;

    const isFav = favorites.includes(recipe.name);
    const recipeRef = doc(firestore, 'users', user.uid, 'savedRecipes', recipe.name.replace(/\s+/g, '-').toLowerCase());

    if (isFav) {
      deleteDoc(recipeRef).catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: recipeRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    } else {
      const data = {
        ...recipe,
        savedAt: serverTimestamp()
      };
      setDoc(recipeRef, data, { merge: true }).catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: recipeRef.path,
          operation: 'write',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth!);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cookingIna_activeTab');
      }
      router.push('/');
    } catch (error: any) {
      toast({ title: "Sign out failed", variant: "destructive" });
    }
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const navigationItems = [
    { id: 'discovery', icon: LayoutDashboard, label: 'Discovery' },
    { id: 'diary', icon: BookOpen, label: 'Cooking Diary' },
    { id: 'vault', icon: Heart, label: 'Recipe Vault' },
    { id: 'profile', icon: UserIcon, label: 'My Profile' },
  ];

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass border-b shrink-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <ChefHat className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-primary">Cooking Ina</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm transition-opacity md:static md:block md:bg-transparent md:backdrop-blur-none",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={cn(
            "w-72 h-full glass border-r p-6 flex flex-col gap-8 transition-transform duration-300 md:translate-x-0",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="hidden md:flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">Cooking Ina</span>
          </div>

          <nav className="flex flex-col gap-2 w-full">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl transition-all text-left",
                  activeTab === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            {isAdmin && (
              <Link href="/admin">
                <div className="flex items-center gap-3 p-4 rounded-2xl text-accent hover:bg-accent/5 transition-all cursor-pointer">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-bold">Admin Center</span>
                </div>
              </Link>
            )}
          </nav>

          <div className="mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 p-4 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background/50 relative">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">
          <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
                {activeTab === 'profile' ? 'Kitchen Profile' : `Welcome Back, ${user.displayName?.split(' ')[0] || 'Chef'}!`}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {activeTab === 'profile' ? 'Manage your enterprise identity' : 'What flavors are we exploring today?'}
              </p>
            </div>
            <div className="flex gap-2">
              {activeTab === 'discovery' && (
                <Button 
                  variant="outline"
                  onClick={() => setIsScannerModalOpen(true)}
                  className="rounded-2xl border-primary text-primary hover:bg-primary/5 shadow-lg gap-2 h-12 flex-1 md:flex-none"
                >
                  <Scan className="w-5 h-5" />
                  Scan Ingredients
                </Button>
              )}
              {(activeTab === 'diary' || activeTab === 'profile') && (
                <Button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="rounded-2xl bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 gap-2 h-12 w-full md:w-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Diary Entry
                </Button>
              )}
            </div>
          </header>

          <div className="w-full space-y-8">
            {activeTab === 'discovery' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <section className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="glass p-5 sm:p-8 rounded-[24px] md:rounded-[32px] border-white/40 shadow-xl shadow-primary/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-xl text-accent">
                            <Flame className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold">Smart Pantry</h3>
                        </div>
                        <Badge variant="outline" className="rounded-full border-accent text-accent hidden sm:flex">Auto-Sync Enabled</Badge>
                      </div>
                      <IngredientTracker 
                        initialIngredients={ingredients}
                        onIngredientsChange={handleIngredientsChange} 
                      />
                      <Button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full mt-6 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white text-lg font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-70"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Consulting Spoonacular...
                          </>
                        ) : (
                          "Find Recipes"
                        )}
                      </Button>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2 px-1">
                          Discovery Results
                          {recipes.length > 0 && <span className="text-xs font-normal text-muted-foreground">({recipes.length})</span>}
                       </h3>
                       
                       {recipes.length > 0 ? (
                         <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                           {recipes.map((r, idx) => (
                             <RecipeCard 
                              key={idx} 
                              recipe={r} 
                              onViewDetails={() => setSelectedRecipe(r)}
                              isSaved={favorites.includes(r.name)}
                              onToggleSave={() => toggleFavorite(r)}
                            />
                           ))}
                         </div>
                       ) : (
                         <div className="p-10 md:p-16 glass rounded-[24px] md:rounded-[32px] border-dashed border-2 border-primary/20 flex flex-col items-center justify-center text-center space-y-4">
                            <ChefHat className="w-12 h-12 text-primary/30" />
                            <div>
                              <p className="text-lg font-bold text-primary">No discoveries yet</p>
                              <p className="text-muted-foreground text-sm">Update your pantry and hit Find Recipes.</p>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="glass p-6 rounded-3xl border-white/40">
                       <div className="flex items-center gap-2 mb-4 text-primary">
                          <TrendingUp className="w-5 h-5" />
                          <h4 className="font-bold uppercase tracking-widest text-xs">Trending Combinations</h4>
                       </div>
                       <div className="space-y-3">
                          {[
                            { pair: "Basil + Balsamic", trend: "+45%", color: "text-accent" },
                            { pair: "Honey + Chili", trend: "+32%", color: "text-primary" },
                            { pair: "Lemon + Rosemary", trend: "+12%", color: "text-accent" },
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/50 border border-white/30 hover:bg-white transition-all cursor-pointer group">
                               <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.pair}</span>
                               <span className={`text-xs font-bold ${item.color}`}>{item.trend}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border-white/40 bg-gradient-to-br from-white/50 to-red-50/30">
                       <div className="flex items-center gap-2 mb-4 text-red-600">
                          <Youtube className="w-5 h-5" />
                          <h4 className="font-bold uppercase tracking-widest text-xs text-foreground">Spoonacular Insights</h4>
                       </div>
                       <div className="p-4 bg-white/60 rounded-2xl border border-red-100 mb-4">
                          <div className="flex gap-3 items-start">
                             <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <Lightbulb className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-foreground">Ingredient ROI</p>
                                <p className="text-xs text-muted-foreground">Maximize recipes with staple goods.</p>
                             </div>
                          </div>
                       </div>
                       <Button 
                          variant="outline" 
                          className="w-full rounded-xl border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 gap-2 font-bold transition-all h-11"
                          asChild
                       >
                          <a href="https://spoonacular.com/food-api" target="_blank" rel="noopener noreferrer">
                            Food Data Insights <ArrowRight className="w-4 h-4" />
                          </a>
                       </Button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'diary' && (
              <div className="animate-in fade-in duration-500 space-y-8">
                <div className="flex flex-col gap-2 px-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-primary">Community Showcase</h3>
                  <p className="text-muted-foreground text-sm md:text-base">Explore culinary memories shared by your enterprise community.</p>
                </div>
                <DiaryFeed />
              </div>
            )}

            {activeTab === 'vault' && (
              <div className="min-h-[60vh] animate-in fade-in duration-500">
                 {savedRecipes.length > 0 ? (
                   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {savedRecipes.map((r: any, idx: number) => (
                       <RecipeCard 
                        key={idx} 
                        recipe={r as Recipe} 
                        onViewDetails={() => setSelectedRecipe(r as Recipe)}
                        isSaved={true}
                        onToggleSave={() => toggleFavorite(r as Recipe)}
                      />
                     ))}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center text-center space-y-6 pt-12">
                     <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                       <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                     </div>
                     <h3 className="text-2xl font-bold">Recipe Vault</h3>
                     <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                       Save dishes from discovery and they will persist in your enterprise profile.
                     </p>
                     <Button variant="outline" className="rounded-xl px-8 h-11 border-primary host-primary" onClick={() => setActiveTab('discovery')}>
                        Start Exploring
                     </Button>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'profile' && (
              <ProfileView />
            )}
          </div>
        </div>
      </main>

      <RecipeDetailsModal 
        recipe={selectedRecipe} 
        isOpen={!!selectedRecipe} 
        onClose={() => setSelectedRecipe(null)} 
        availableIngredients={ingredients}
      />

      <DiaryUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

      <IngredientScannerModal 
        isOpen={isScannerModalOpen} 
        onClose={() => setIsScannerModalOpen(false)} 
        onIngredientsFound={handleScannerResults}
      />
    </div>
  );
}
