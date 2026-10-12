// services/recipes.ts
// Moved out of Test.tsx so pages can import it without pulling in a page component.

const MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type GeneratedRecipe = {
  prepTime: string;
  cookTime: string;
  instructions: string[];
};

export class RecipeApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RecipeApiError';
    this.status = status;
  }
}

/**
 * Generates cooking instructions for a dish.
 * Throws RecipeApiError on failure (it does NOT swallow errors and return []),
 * so the UI can show what actually went wrong.
 */
export async function generateRecipe(
  dish: string,
  ingredients?: string
): Promise<GeneratedRecipe> {
  const name = dish.trim();
  if (!name) throw new RecipeApiError('No dish name provided.');

  // NOTE: import.meta.env only works in Vite. In Create React App use
  // process.env.REACT_APP_GROQ_API_KEY instead.
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new RecipeApiError(
      'Missing API key. Set VITE_GROQ_API_KEY in .env and restart the dev server.',
      401
    );
  }

  const userContent = ingredients?.trim()
    ? `Dish: ${name}\nIngredients: ${ingredients.trim()}`
    : `Dish: ${name}`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional chef. Generate clear, step-by-step cooking instructions for the dish provided' +
            (ingredients?.trim()
              ? ', using only the listed ingredients (plus standard pantry items like salt, water or oil if necessary). '
              : '. ') +
            'Respond ONLY with a JSON object in exactly this shape: ' +
            '{"prepTime": string (e.g. "15 mins"), "cookTime": string (e.g. "45 mins"), "instructions": string[] (ordered cooking steps)}. ' +
            'Write the instructions in the same language as the dish name.',
        },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new RecipeApiError(
      body?.error?.message || response.statusText,
      response.status
    );
  }

  const completion = await response.json();
  const raw = completion.choices?.[0]?.message?.content || '{}';

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new RecipeApiError('The model returned invalid JSON. Try again.');
  }

  const instructions: string[] = Array.isArray(parsed.instructions)
    ? parsed.instructions.map(String)
    : [];

  if (instructions.length === 0) {
    throw new RecipeApiError('The model returned no instructions. Try again.');
  }

  return {
    prepTime: parsed.prepTime || 'N/A',
    cookTime: parsed.cookTime || 'N/A',
    instructions,
  };
}

export function describeRecipeError(err: unknown): string {
  if (err instanceof RecipeApiError) {
    if (err.status === 429) return 'Rate limit reached on the free tier. Wait a minute and try again.';
    if (err.status === 401) return err.message.startsWith('Missing')
      ? err.message
      : 'Invalid API key. Check VITE_GROQ_API_KEY in your .env file.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}