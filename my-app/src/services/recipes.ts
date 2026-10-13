// services/recipes.ts
// Moved out of Test.tsx so pages can import it without pulling in a page component.

const MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type GeneratedRecipe = {
  prepTime: string;
  cookTime: string;
  instructions: string[];
};

export type RecipeCandidate = {
  nummer: number;
  namn: string;
};

export type RecipeMatch = {
  nummer: number;
  namn: string;
  reason: string;
};

export class RecipeApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RecipeApiError';
    this.status = status;
  }
}

function getApiKey(): string {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new RecipeApiError(
      'Missing API key. Set VITE_GROQ_API_KEY in .env and restart the dev server.',
      401
    );
  }
  return apiKey;
}

async function groqJson(
  systemContent: string,
  userContent: string,
  temperature = 0.4
): Promise<Record<string, unknown>> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      messages: [
        { role: 'system', content: systemContent },
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

  try {
    return JSON.parse(raw);
  } catch {
    throw new RecipeApiError('The model returned invalid JSON. Try again.');
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

  const userContent = ingredients?.trim()
    ? `Dish: ${name}\nIngredients: ${ingredients.trim()}`
    : `Dish: ${name}`;

  const parsed = await groqJson(
    'You are a professional chef. Generate clear, step-by-step cooking instructions for the dish provided' +
      (ingredients?.trim()
        ? ', using only the listed ingredients (plus standard pantry items like salt, water or oil if necessary). '
        : '. ') +
      'Respond ONLY with a JSON object in exactly this shape: ' +
      '{"prepTime": string (e.g. "15 mins"), "cookTime": string (e.g. "45 mins"), "instructions": string[] (ordered cooking steps)}. ' +
      'Write prepTime, cookTime, and every instruction step in English only, even if the dish name or ingredients are in another language.',
    userContent
  );

  const instructions: string[] = Array.isArray(parsed.instructions)
    ? parsed.instructions.map(String)
    : [];

  if (instructions.length === 0) {
    throw new RecipeApiError('The model returned no instructions. Try again.');
  }

  return {
    prepTime: String(parsed.prepTime || 'N/A'),
    cookTime: String(parsed.cookTime || 'N/A'),
    instructions,
  };
}

export async function extractSearchKeywords(prompt: string): Promise<string[]> {
  const text = prompt.trim();
  if (!text) throw new RecipeApiError('No dish type provided.');

  const parsed = await groqJson(
    'You help search a catalog of English dish names from the Swedish Food Agency. ' +
      'Given a user request for a type of dish, return English search keywords that are likely to appear in dish names. ' +
      'Respond ONLY with JSON: {"keywords": string[]}. Use 2 to 8 short keywords (ingredients, cuisine, meal type). ' +
      'Do not invent dish names. Prefer common food words like chicken, pasta, soup, salmon, potato.',
    `User request: ${text}`
  );

  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords
        .map((word) => String(word).trim().toLocaleLowerCase('sv-SE'))
        .filter((word) => word.length > 1)
    : [];

  if (keywords.length === 0) {
    throw new RecipeApiError('The model returned no search keywords. Try again.');
  }

  return keywords;
}

export async function findRecipeMatch(
  prompt: string,
  candidates: RecipeCandidate[]
): Promise<RecipeMatch> {
  const text = prompt.trim();
  if (!text) throw new RecipeApiError('No dish type provided.');
  if (candidates.length === 0) {
    throw new RecipeApiError('No matching recipes were found in the catalog.');
  }

  const parsed = await groqJson(
    'You pick the single best matching dish from a catalog for the user request. ' +
      'Respond ONLY with JSON: {"nummer": number, "namn": string, "reason": string}. ' +
      'nummer and namn MUST be copied exactly from one catalog entry. ' +
      'reason is one short sentence in English explaining the match.',
    `User request: ${text}\nCatalog:\n${JSON.stringify(candidates)}`
  );

  const nummer = Number(parsed.nummer);
  const namn = String(parsed.namn || '').trim();
  const reason = String(parsed.reason || '').trim() || 'Closest match in the catalog.';

  const byId = candidates.find((dish) => dish.nummer === nummer);
  if (byId) {
    return { nummer: byId.nummer, namn: byId.namn, reason };
  }

  const byName = candidates.find(
    (dish) => dish.namn.toLocaleLowerCase('sv-SE') === namn.toLocaleLowerCase('sv-SE')
  );
  if (byName) {
    return { nummer: byName.nummer, namn: byName.namn, reason };
  }

  const fallback = candidates[0];
  return {
    nummer: fallback.nummer,
    namn: fallback.namn,
    reason: reason || 'Used the closest catalog result.',
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
