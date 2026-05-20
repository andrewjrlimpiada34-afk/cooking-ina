'use server';
/**
 * @fileOverview A flow that uses AI Vision to identify raw ingredients from an image.
 *
 * - scanIngredients - A function that identifies ingredients in a photo.
 * - ScanIngredientsInput - The input type (photo data URI).
 * - ScanIngredientsOutput - The list of identified ingredients.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanIngredientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of culinary ingredients, as a data URI that must include a MIME type and use Base64 encoding."
    ),
});
export type ScanIngredientsInput = z.infer<typeof ScanIngredientsInputSchema>;

const ScanIngredientsOutputSchema = z.object({
  ingredients: z.array(z.string()).describe('A list of identified raw ingredients.'),
});
export type ScanIngredientsOutput = z.infer<typeof ScanIngredientsOutputSchema>;

export async function scanIngredients(input: ScanIngredientsInput): Promise<ScanIngredientsOutput> {
  return scanIngredientsFlow(input);
}

const scanIngredientsFlow = ai.defineFlow(
  {
    name: 'scanIngredientsFlow',
    inputSchema: ScanIngredientsInputSchema,
    outputSchema: ScanIngredientsOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      prompt: [
        { text: "Analyze this image and identify all the raw culinary ingredients you see. List them clearly. Be precise but concise (e.g., 'Tomato', 'Chicken Breast', 'Garlic')." },
        { media: { url: input.photoDataUri } }
      ],
      output: { schema: ScanIngredientsOutputSchema }
    });

    return response.output || { ingredients: [] };
  }
);
