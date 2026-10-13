// This file handles all LLM endpoints related 
// to the database.


/**
 * LLM Service
 *
 * Communicates with our Python FastAPI backend
 * to classify recipes using Groq AI.
 */

export type RecipeClassification = {
  cuisine: string;
  meal_type: string[];
  main_ingredient: string;
  diet: string[];
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Send a recipe to the backend for AI classification
export async function classifyRecipe(
  title: string,
  ingredients: string[]
): Promise<RecipeClassification> {
  const response = await fetch(`${API_URL}/classify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      ingredients,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Recipe classification failed: ${response.status}`
    );
  }

  const data: RecipeClassification = await response.json();

  return data;
}

