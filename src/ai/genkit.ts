
import {genkit} from 'genkit';
import {openAI} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI(),
  ],
  // Using gpt-4o for high-quality and reliable culinary reasoning
  model: 'openai/gpt-4o',
});
