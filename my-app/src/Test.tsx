import React, { useState } from 'react';
import OpenAI from 'openai';

interface RecipeData {
  dish: string;
  ingredients: string;
  instructions: string[];
  prepTime: string;
  cookTime: string;
}

// Groq exposes an OpenAI-compatible API, so the OpenAI SDK works unchanged.
// In client-side Vite apps this requires `dangerouslyAllowBrowser: true`.
const client = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
});

// Alternatives: 'llama-3.1-8b-instant' (faster, higher rate limits, slightly lower quality)
const MODEL = 'openai/gpt-oss-20b';

export default function RecipeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setRecipe(null);
    setError(null);

    const mockApiData = {
      dish: prompt.trim() || 'Laxpudding',
      ingredients:
        'Dill färsk - 35 g, Lax gravad - 200 g, Lax rimmad - 200 g, Lök gul - 95 g, Mjölk fett 3% berikad - 400 g, Potatis höst rå - 630 g, Salt m. jod - 2.8 g, Ägg rått - 150 g',
    };

    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional chef. You will be provided a dish name and a list of ingredients. ' +
              'Generate clear, step-by-step cooking instructions using only those ingredients ' +
              '(plus standard pantry items like salt, water, or oil if necessary). ' +
              'Respond ONLY with a JSON object in exactly this shape: ' +
              '{"prepTime": string (e.g. "15 mins"), "cookTime": string (e.g. "45 mins"), "instructions": string[] (ordered cooking steps)}. ' +
              'Write the instructions in the same language as the dish name.',
          },
          {
            role: 'user',
            content: `Dish: ${mockApiData.dish}\nIngredients: ${mockApiData.ingredients}`,
          },
        ],
        // json_object works on all Groq chat models; the shape is enforced via the prompt above.
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      setRecipe({
        dish: mockApiData.dish,
        ingredients: mockApiData.ingredients,
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions.map(String) : [],
        prepTime: parsed.prepTime || 'N/A',
        cookTime: parsed.cookTime || 'N/A',
      });
    } catch (err: any) {
      console.error('Groq generation failed:', err);
      if (err?.status === 429) {
        setError('Rate limit reached on the free tier. Wait a minute and try again.');
      } else if (err?.status === 401) {
        setError('Invalid or missing API key. Check VITE_GROQ_API_KEY in your .env file.');
      } else if (err instanceof SyntaxError) {
        setError('The model returned invalid JSON. Try again.');
      } else {
        setError(`Generation failed: ${err?.message || 'see the console for details'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <h2>AI Recipe Builder</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
        <input
          type="text"
          name="dishPrompt"
          placeholder="e.g., Laxpudding"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          style={{ flexGrow: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {loading ? 'Generating...' : 'Get Recipe'}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: '#b00020', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {recipe && (
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>{recipe.dish}</h3>
          <p>
            ⏱️ <strong>Prep:</strong> {recipe.prepTime} | <strong>Cook:</strong> {recipe.cookTime}
          </p>

          <h4>Ingredients:</h4>
          <p style={{ color: '#555' }}>{recipe.ingredients}</p>

          <h4>Instructions:</h4>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            {recipe.instructions.map((step, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}