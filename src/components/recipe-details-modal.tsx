
"use client"

import React, { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, ListChecks, Youtube, ChefHat, Star, Send, User, MessageSquare, Lightbulb, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ingredientSubstitutionSuggestion, type IngredientSubstitutionOutput } from '@/ai/flows/ingredient-substitute-flow';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  name: string;
  matchPercentage: number;
  ingredientsRequired: string[];
  missingIngredients: string[];
  instructions: string[];
  estimatedTimeMinutes: number;
}

interface RecipeDetailsModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  availableIngredients?: string[];
}

export function RecipeDetailsModal({ recipe, isOpen, onClose, availableIngredients = [] }: RecipeDetailsModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [substitutions, setSubstitutions] = useState<IngredientSubstitutionOutput['substitutions'] | null>(null);
  const [isGeneratingSubstitutes, setIsGeneratingSubstitutes] = useState(false);

  const recipeSlug = useMemo(() => {
    if (!recipe?.name) return '';
    return recipe.name.replace(/\s+/g, '-').toLowerCase();
  }, [recipe?.name]);

  const reviewsQuery = useMemo(() => {
    if (!firestore || !recipeSlug) return null;
    return query(
      collection(firestore, 'recipes', recipeSlug, 'reviews'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, recipeSlug]);

  const { data: reviews = [] } = useCollection(reviewsQuery);

  const handleGetSubstitutes = async () => {
    if (!recipe || isGeneratingSubstitutes) return;
    
    setIsGeneratingSubstitutes(true);
    try {
      const result = await ingredientSubstitutionSuggestion({
        availableIngredients,
        missingIngredients: recipe.missingIngredients,
        recipeContext: `Recipe: ${recipe.name}. Instructions: ${recipe.instructions.join(' ')}`
      });
      setSubstitutions(result.substitutions);
      toast({
        title: "Substitutes Found!",
        description: "Andrew's Pan found some alternatives for your missing items."
      });
    } catch (e) {
      toast({
        title: "Substitution failed",
        description: "The culinary spirits are quiet right now.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSubstitutes(false);
    }
  };

  const handleSubmitReview = () => {
    if (!user || !firestore || rating === 0 || !comment.trim()) return;

    setIsSubmittingReview(true);
    const reviewRef = doc(firestore, 'recipes', recipeSlug, 'reviews', user.uid);
    const reviewData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous Chef',
      userPhoto: user.photoURL || '',
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp()
    };

    setDoc(reviewRef, reviewData, { merge: true })
      .then(() => {
        setRating(0);
        setComment('');
        toast({ title: "Opinion Shared!", description: "Thanks for contributing to the community!" });
      })
      .catch(async (e) => {
        const permissionError = new FirestorePermissionError({
          path: reviewRef.path,
          operation: 'write',
          requestResourceData: reviewData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmittingReview(false);
      });
  };

  if (!recipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setSubstitutions(null);
      }
    }}>
      <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[95vh] p-0 overflow-hidden border-none glass shadow-2xl flex flex-col">
        <div className="h-32 md:h-48 bg-primary/10 relative overflow-hidden flex items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <ChefHat className="w-16 h-16 md:w-24 md:h-24 text-primary/20 animate-pulse" />
          <div className="absolute bottom-4 left-6">
             <Badge className="bg-accent text-white border-none mb-2 shadow-lg">Match: {recipe.matchPercentage}%</Badge>
          </div>
        </div>

        <ScrollArea className="flex-grow">
          <div className="p-6 md:p-8 space-y-8">
            <DialogHeader>
              <div className="flex justify-between items-start mb-2">
                <DialogTitle className="text-2xl md:text-3xl font-bold text-primary">{recipe.name}</DialogTitle>
              </div>
              <DialogDescription className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4" /> {recipe.estimatedTimeMinutes} mins</span>
                <span className="flex items-center gap-1.5 font-medium"><ListChecks className="w-4 h-4" /> {recipe.ingredientsRequired.length} ingredients</span>
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Ingredients
                </h4>
                {recipe.missingIngredients.length > 0 && !substitutions && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-full text-[10px] gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                    onClick={handleGetSubstitutes}
                    disabled={isGeneratingSubstitutes}
                  >
                    {isGeneratingSubstitutes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
                    Get Substitutes
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.ingredientsRequired.map((ing, i) => {
                  const isMissing = recipe.missingIngredients.includes(ing);
                  return (
                    <div key={i} className={`flex items-center gap-2 text-sm p-3 rounded-xl border transition-colors ${isMissing ? 'bg-destructive/5 border-destructive/10 text-destructive/80' : 'bg-primary/5 border-primary/10 text-foreground'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isMissing ? 'bg-destructive' : 'bg-accent'}`} />
                      {ing}
                    </div>
                  );
                })}
              </div>

              {substitutions && (
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <h5 className="text-xs font-bold text-accent flex items-center gap-2 uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4" />
                    Andrew's Pan Suggestions
                  </h5>
                  <div className="space-y-3">
                    {substitutions.map((sub, i) => (
                      <div key={i} className="bg-white/50 p-3 rounded-xl border border-white/40 shadow-sm">
                        <p className="text-xs font-bold text-primary mb-1">
                          Instead of <span className="text-destructive">{sub.missingIngredient}</span>, use <span className="text-accent">{sub.suggestedSubstitution}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {sub.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-accent rounded-full" />
                Instructions
              </h4>
              <div className="space-y-6">
                {recipe.instructions.map((step, i) => (
                  <div key={i} className="flex gap-4 group">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors pt-1">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <Separator className="bg-primary/10" />

            <section className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Community Opinions
              </h4>

              {user ? (
                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary/80">Rate this dish:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="transition-transform active:scale-90 hover:scale-110"
                        >
                          <Star 
                            className={`w-6 h-Star ${rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground opacity-30'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Any secret tips for this recipe?"
                    className="min-h-[80px] bg-white border-primary/20 rounded-xl focus:ring-accent"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button 
                    className="w-full gap-2 rounded-xl h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    disabled={rating === 0 || !comment.trim() || isSubmittingReview}
                    onClick={handleSubmitReview}
                  >
                    {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Post Opinion</>}
                  </Button>
                </div>
              ) : (
                <div className="p-6 bg-muted/50 rounded-2xl text-center text-sm text-muted-foreground border border-dashed border-primary/20">
                  Join the community to share your wisdom!
                </div>
              )}

              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review: any) => (
                    <div key={review.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Avatar className="w-10 h-10 border-2 border-primary/10 shadow-sm">
                        <AvatarImage src={review.userPhoto} className="object-cover" />
                        <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary">{review.userId === user?.uid ? 'You' : review.userName}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${review.rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground opacity-20'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-white/50 p-3 rounded-xl border border-white/40 italic">
                          "{review.comment}"
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 pl-1">
                          {review.createdAt ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8 italic border-t border-primary/5 mt-4">No reviews yet. Be the first to stir the pot!</p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Button variant="outline" className="flex-1 gap-2 rounded-xl h-12 border-primary/20 hover:bg-primary/5 text-primary" asChild>
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.name + ' recipe')}`} target="_blank" rel="noopener noreferrer">
              <Youtube className="w-4 h-4 text-red-600" />
              Watch Tutorial
            </a>
          </Button>
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-12 shadow-xl shadow-primary/20" onClick={onClose}>
            Happy Cooking!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
