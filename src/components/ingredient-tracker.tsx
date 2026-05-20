
"use client"

import React, { useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIngredients } from '@/hooks/use-ingredients';
import { cn } from '@/lib/utils';

interface IngredientTrackerProps {
  initialIngredients?: string[];
  onIngredientsChange?: (ingredients: string[]) => void;
  className?: string;
}

export function IngredientTracker({ initialIngredients, onIngredientsChange, className }: IngredientTrackerProps) {
  const { 
    ingredients, 
    setIngredients,
    inputValue, 
    setInputValue, 
    addIngredient, 
    removeIngredient, 
    suggestions 
  } = useIngredients();

  // Load initial ingredients from external prop (e.g. Firestore)
  useEffect(() => {
    if (initialIngredients && initialIngredients.length > 0) {
      setIngredients(initialIngredients);
    }
  }, [initialIngredients, setIngredients]);

  // Sync back to parent whenever local state changes
  useEffect(() => {
    onIngredientsChange?.(ingredients);
  }, [ingredients, onIngredientsChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient(inputValue);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <Input
          placeholder="Add ingredients (e.g. Garlic, Chicken...)"
          className="pl-10 h-12 bg-white/50 border-white/40 focus:bg-white transition-all shadow-sm rounded-xl"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {suggestions.length > 0 && (inputValue.length > 0) && (
          <div className="absolute top-full left-0 w-full z-50 mt-1 bg-white border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {suggestions.map((s) => (
              <button
                key={s}
                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center justify-between group"
                onClick={() => addIngredient(s)}
              >
                <span>{s}</span>
                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground italic px-1">No ingredients added yet.</p>
        ) : (
          ingredients.map((ing) => (
            <Badge
              key={ing}
              variant="secondary"
              className="py-1.5 pl-3 pr-2 text-sm bg-primary/10 text-primary border-primary/20 animate-in zoom-in-95"
            >
              {ing}
              <button
                className="ml-2 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                onClick={() => removeIngredient(ing)}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
