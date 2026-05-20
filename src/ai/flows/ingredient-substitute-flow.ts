
'use server';
/**
 * @fileOverview Suggests suitable ingredient substitutions using the Spoonacular API.
 * AI is restricted to the chatbot only, so we use Spoonacular's specific endpoint here.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IngredientSubstitutionInputSchema = z.object({
  availableIngredients: z
    .array(z.string())
    .describe('A list of ingredients the user currently has.'),
  missingIngredients: z
    .array(z.string())
    .describe('A list of missing ingredients.'),
  recipeContext: z.string().optional(),
});
export type IngredientSubstitutionInput = z.infer<typeof IngredientSubstitutionInputSchema>;

const IngredientSubstitutionOutputSchema = z.object({
  substitutions: z
    .array(
      z.object({
        missingIngredient: z.string(),
        suggestedSubstitution: z.string(),
        reason: z.string(),
        notes: z.string().optional(),
      })
    ),
});
export type IngredientSubstitutionOutput = z.infer<typeof IngredientSubstitutionOutputSchema>;

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

export async function ingredientSubstitutionSuggestion(
  input: IngredientSubstitutionInput
): Promise<IngredientSubstitutionOutput> {
  return ingredientSubstitutionSuggestionFlow(input);
}

const ingredientSubstitutionSuggestionFlow = ai.defineFlow(
  {
    name: 'ingredientSubstitutionSuggestionFlow',
    inputSchema: IngredientSubstitutionInputSchema,
    outputSchema: IngredientSubstitutionOutputSchema,
  },
  async (input) => {
    if (!SPOONACULAR_API_KEY) {
      throw new Error('SPOONACULAR_API_KEY is not configured.');
    }

    const results = await Promise.all(
      input.missingIngredients.map(async (ing) => {
        try {
          const response = await fetch(
            `https://api.spoonacular.com/food/ingredients/substitutes?ingredientName=${encodeURIComponent(ing)}&apiKey=${SPOONACULAR_API_KEY}`
          );

          if (!response.ok) return null;
          const data = await response.json();

          if (data.status === 'failure' || !data.substitutes || data.substitutes.length === 0) {
            return {
              missingIngredient: ing,
              suggestedSubstitution: 'Common Alternative',
              reason: 'General culinary substitute.',
              notes: 'Spoonacular did not have a specific match for this item.'
            };
          }

          return {
            missingIngredient: ing,
            suggestedSubstitution: data.substitutes[0],
            reason: data.message || 'Common culinary swap.',
            notes: data.substitutes.length > 1 ? `Other options: ${data.substitutes.slice(1).join(', ')}` : undefined
          };
        } catch (e) {
          return {
            missingIngredient: ing,
            suggestedSubstitution: 'Alternative',
            reason: 'General substitute.',
          };
        }
      })
    );

    return {
      substitutions: results.filter((r) => r !== null) as IngredientSubstitutionOutput['substitutions'],
    };
  }
);
