
'use server';
/**
 * @fileOverview A flow for generating recipe suggestions using the Spoonacular API.
 * This flow no longer uses AI prompts, following the requirement to use AI only for the chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecipeGeneratorInputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients currently available to the user.'),
});
export type RecipeGeneratorInput = z.infer<typeof RecipeGeneratorInputSchema>;

const RecipeOutputSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  matchPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('The percentage of required ingredients that are available.'),
  ingredientsRequired: z
    .array(z.string())
    .describe('A list of all ingredients required for this recipe.'),
  missingIngredients: z
    .array(z.string())
    .describe('A list of ingredients NOT present in the user\'s available list.'),
  instructions: z
    .array(z.string())
    .describe('Step-by-step cooking instructions.'),
  estimatedTimeMinutes: z
    .number()
    .describe('Estimated time in minutes.'),
});

const RecipeGeneratorOutputSchema = z.object({
  recipes: z
    .array(RecipeOutputSchema)
    .describe('A list of suggested recipes from Spoonacular.'),
});
export type RecipeGeneratorOutput = z.infer<typeof RecipeGeneratorOutputSchema>;

export async function generateRecipes(
  input: RecipeGeneratorInput
): Promise<RecipeGeneratorOutput> {
  return recipeGeneratorFlow(input);
}

const recipeGeneratorFlow = ai.defineFlow(
  {
    name: 'recipeGeneratorFlow',
    inputSchema: RecipeGeneratorInputSchema,
    outputSchema: RecipeGeneratorOutputSchema,
  },
  async (input) => {
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
    
    if (!SPOONACULAR_API_KEY) {
      throw new Error('SPOONACULAR_API_KEY is not configured in environment variables.');
    }

    const ingredientsQuery = input.ingredients.join(',');
    
    // 1. Find recipes by ingredients
    const findResponse = await fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientsQuery)}&number=5&ranking=1&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!findResponse.ok) {
      const errorData = await findResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Spoonacular API error: ${findResponse.status}`);
    }

    const basicRecipes = await findResponse.json();
    
    // 2. Fetch detailed information for each recipe to get instructions and time
    const detailedRecipes = await Promise.all(
      basicRecipes.map(async (basic: any) => {
        const detailResponse = await fetch(
          `https://api.spoonacular.com/recipes/${basic.id}/information?apiKey=${SPOONACULAR_API_KEY}`
        );
        
        if (!detailResponse.ok) return null;
        const details = await detailResponse.json();

        const ingredientsRequired = details.extendedIngredients.map((ing: any) => ing.original);
        const missingIngredients = basic.missedIngredients.map((ing: any) => ing.original);
        
        // Calculate match percentage
        const totalCount = details.extendedIngredients.length;
        const usedCount = basic.usedIngredientCount;
        const matchPercentage = Math.round((usedCount / totalCount) * 100);

        return {
          name: details.title,
          matchPercentage: matchPercentage,
          ingredientsRequired: ingredientsRequired,
          missingIngredients: missingIngredients,
          instructions: details.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) || ["See tutorial for detailed steps."],
          estimatedTimeMinutes: details.readyInMinutes || 30,
        };
      })
    );

    return {
      recipes: detailedRecipes.filter((r) => r !== null) as RecipeGeneratorOutput['recipes'],
    };
  }
);
