"use client"

import React from 'react';
import { Clock, CheckCircle2, AlertCircle, ChefHat, Heart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface RecipeCardProps {
  recipe: {
    name: string;
    matchPercentage: number;
    ingredientsRequired: string[];
    missingIngredients: string[];
    instructions: string[];
    estimatedTimeMinutes: number;
  };
  onViewDetails: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function RecipeCard({ recipe, onViewDetails, isSaved, onToggleSave }: RecipeCardProps) {
  return (
    <Card className="glass group hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full border-white/30">
      <CardHeader className="p-5 pb-2 relative">
        <div className="absolute top-4 right-4 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full h-8 w-8 ${isSaved ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave?.();
            }}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <ChefHat className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Recipe Suggestion</span>
        </div>
        <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {recipe.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 flex-grow space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-muted-foreground">Ingredient Match</span>
            <span className={recipe.matchPercentage > 75 ? 'text-accent' : 'text-primary'}>
              {recipe.matchPercentage}%
            </span>
          </div>
          <Progress 
            value={recipe.matchPercentage} 
            className="h-2 bg-muted-foreground/10"
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{recipe.estimatedTimeMinutes}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>{recipe.ingredientsRequired.length - recipe.missingIngredients.length} In-hand</span>
          </div>
        </div>

        {recipe.missingIngredients.length > 0 && (
          <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/10">
            <div className="flex items-center gap-1.5 text-destructive text-xs font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Missing Items</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {recipe.missingIngredients.join(', ')}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-10 shadow-lg shadow-primary/20"
          onClick={onViewDetails}
        >
          View Cooking Insights
        </Button>
      </CardFooter>
    </Card>
  );
}
