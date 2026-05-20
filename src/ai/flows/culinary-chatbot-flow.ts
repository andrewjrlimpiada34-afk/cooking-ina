'use server';
/**
 * @fileOverview A friendly AI culinary assistant flow with multi-turn conversation support.
 *
 * - culinaryChat - A function that handles general cooking questions.
 * - CulinaryChatInput - The input type for the chat.
 * - CulinaryChatOutput - The return type for the chat.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CulinaryChatInputSchema = z.object({
  message: z.string().describe('The user message or question.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional().describe('The chat history for context.'),
});
export type CulinaryChatInput = z.infer<typeof CulinaryChatInputSchema>;

const CulinaryChatOutputSchema = z.object({
  response: z.string().describe('The AI response to the user message.'),
});
export type CulinaryChatOutput = z.infer<typeof CulinaryChatOutputSchema>;

export async function culinaryChat(input: CulinaryChatInput): Promise<CulinaryChatOutput> {
  return culinaryChatFlow(input);
}

const culinaryChatFlow = ai.defineFlow(
  {
    name: 'culinaryChatFlow',
    inputSchema: CulinaryChatInputSchema,
    outputSchema: CulinaryChatOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      system: `You are "Andrew's Pan", a cute and helpful cooking pan AI assistant. 
      You are friendly, use occasional food puns, and expert in all things culinary. 
      Keep your responses helpful, encouraging, and concise.`,
      messages: [
        ...(input.history || []).map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
        { role: 'user', content: [{ text: input.message }] }
      ]
    });

    return { response: response.text };
  }
);
