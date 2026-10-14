import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FavoriteButton from '../components/FavoriteButton';
import { getDishes, getIngredients } from '../services/api';
import {
  describeRecipeError,
  extractSearchKeywords,
  findRecipeMatch,
  generateRecipe,
  type GeneratedRecipe,
  type RecipeCandidate,
} from '../services/recipes';
import type { Food, Ingredient } from '../types/food';
import './Cook.css';

import "../App.css"

const SHORTLIST_LIMIT = 40;

function formatIngredient(ingredient: Ingredient): string {
  if (!ingredient.namn) return '';
  return ingredient.viktForeTillagning != null
    ? `${ingredient.namn} - ${ingredient.viktForeTillagning} g`
    : ingredient.namn;
}

function filterDishes(dishes: Food[], keywords: string[]): Food[] {
  const terms = keywords
    .map((word) => word.trim().toLocaleLowerCase('sv-SE'))
    .filter((word) => word.length > 1);

  if (terms.length === 0) return [];

  return dishes.filter((dish) => {
    const name = dish.namn.toLocaleLowerCase('sv-SE');
    return terms.some((term) => name.includes(term));
  });
}

function toCandidates(dishes: Food[]): RecipeCandidate[] {
  return dishes.slice(0, SHORTLIST_LIMIT).map((dish) => ({
    nummer: dish.nummer,
    namn: dish.namn,
  }));
}

function pickDish(dishes: Food[], match: { nummer: number; namn: string }): Food | undefined {
  return (
    dishes.find((dish) => dish.nummer === match.nummer) ??
    dishes.find(
      (dish) =>
        dish.namn.toLocaleLowerCase('sv-SE') === match.namn.toLocaleLowerCase('sv-SE')
    )
  );
}

export default function Brainstorm() {
  const [prompt, setPrompt] = useState('');
  const [dishes, setDishes] = useState<Food[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [finding, setFinding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matchedDish, setMatchedDish] = useState<Food | null>(null);
  const [matchReason, setMatchReason] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});

  const requestId = useRef(0);

  useEffect(() => {
    let active = true;

    async function loadDishes() {
      try {
        const data = await getDishes();
        if (active) {
          setDishes(data);
          setCatalogError(null);
        }
      } catch (err) {
        console.error('Failed to load dishes:', err);
        if (active) setCatalogError('Could not load dishes.');
      } finally {
        if (active) setCatalogLoading(false);
      }
    }

    loadDishes();
    return () => {
      active = false;
    };
  }, []);

  const loadInstructions = async (
    dish: Food,
    ingredientLines: string[],
    thisRequest: number
  ) => {
    setGenerating(true);
    try {
      const result = await generateRecipe(dish.namn, ingredientLines.join(', '));
      if (thisRequest !== requestId.current) return;
      setRecipe(result);
    } catch (err) {
      console.error('Recipe generation failed:', err);
      if (thisRequest !== requestId.current) return;
      setError(describeRecipeError(err));
    } finally {
      if (thisRequest === requestId.current) setGenerating(false);
    }
  };

  const findAndLoad = async (dishPrompt: string) => {
    const text = dishPrompt.trim();
    if (!text) return;

    const thisRequest = ++requestId.current;
    setFinding(true);
    setGenerating(false);
    setError(null);
    setMatchedDish(null);
    setMatchReason('');
    setIngredients([]);
    setRecipe(null);
    setDone({});

    try {
      const keywords = await extractSearchKeywords(text);
      if (thisRequest !== requestId.current) return;

      let shortlist = filterDishes(dishes, keywords);
      if (shortlist.length === 0) {
        shortlist = dishes.slice(0, SHORTLIST_LIMIT);
      }
      if (shortlist.length === 0) {
        throw new Error('No recipes found. Try another search.');
      }

      const match = await findRecipeMatch(text, toCandidates(shortlist));
      if (thisRequest !== requestId.current) return;

      const dish = pickDish(shortlist, match) ?? pickDish(dishes, match) ?? shortlist[0];
      const ingredientData = await getIngredients(dish.nummer);
      if (thisRequest !== requestId.current) return;

      const ingredientLines = ingredientData.map(formatIngredient).filter(Boolean);

      setMatchedDish(dish);
      setMatchReason(match.reason);
      setIngredients(ingredientLines);
      setFinding(false);
      await loadInstructions(dish, ingredientLines, thisRequest);
    } catch (err) {
      console.error('Brainstorm search failed:', err);
      if (thisRequest !== requestId.current) return;
      setError(describeRecipeError(err));
      setFinding(false);
      setGenerating(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (finding || generating || catalogLoading) return;
    findAndLoad(prompt);
  };

  const navigate = useNavigate()

  return (
    <main className="cook-page">
      <header className="cook-header">
        <div>
          <button onClick={() => navigate("/")} className="cook-back">
            ← Home
          </button>
          <h1 className="cook-title">Brainstorm</h1>
          <p className="cook-subtitle">
            Describe the kind of dish you want and we will find a matching recipe.
          </p>
        </div>
      </header>

      <form className="cook-picker cook-card" onSubmit={handleSubmit}>
        <label htmlFor="dish-type">What type of dish do you want?</label>
        <input
          id="dish-type"
          type="text"
          name="dishPrompt"
          placeholder="e.g. spicy chicken soup"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <div className="cook-actions">
          <button type="submit" disabled={finding || generating || catalogLoading}>
            {finding || generating ? 'Working...' : 'Find recipe'}
          </button>
        </div>
      </form>

      {catalogLoading && (
        <div className="cook-loading">
          <p>Loading the recipe catalog...</p>
        </div>
      )}

      {catalogError && (
        <div className="cook-error" role="alert">
          <p>{catalogError}</p>
        </div>
      )}

      {finding && (
        <div className="cook-loading">
          <p>Searching the recipe catalog...</p>
        </div>
      )}

      {error && (
        <div className="cook-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => findAndLoad(prompt)}>
            Try again
          </button>
        </div>
      )}

      {matchedDish && (
        <section className="cook-selected">
          <h2 className="cook-section-title">{matchedDish.namn}</h2>
          {matchReason && <p className="cook-subtitle">{matchReason}</p>}
          <FavoriteButton dish={matchedDish} />

          {recipe && (
            <div className="recipe-meta">
              <span>⏱️ Prep: {recipe.prepTime}</span>
              <span>🍳 Cook: {recipe.cookTime}</span>
            </div>
          )}

          <div className="cook-layout">
            <div className="instructions-card">
              <h2 className="cook-section-title">Instructions</h2>

              {generating && <p>Writing your instructions...</p>}

              {recipe && (
                <>
                  <ol className="instructions-list">
                    {recipe.instructions.map((step, i) => (
                      <li
                        key={`${matchedDish.nummer}-${i}`}
                        className={done[i] ? 'step-done' : undefined}
                      >
                        <label className="step-label">
                          <input
                            type="checkbox"
                            checked={!!done[i]}
                            onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                          />
                          <span className="step-text">{step}</span>
                        </label>
                      </li>
                    ))}
                  </ol>

                  <div className="cook-actions">
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => {
                        const thisRequest = ++requestId.current;
                        setError(null);
                        setRecipe(null);
                        setDone({});
                        loadInstructions(matchedDish, ingredients, thisRequest);
                      }}
                    >
                      Regenerate
                    </button>
                  </div>
                </>
              )}
            </div>

            <aside className="ingredients-card">
              <h2 className="cook-section-title">Ingredients</h2>
              {ingredients.length > 0 ? (
                <ul className="ingredients-list">
                  {ingredients.map((ing, i) => (
                    <li key={`${ing}-${i}`}>{ing}</li>
                  ))}
                </ul>
              ) : (
                <p>No ingredients listed for this recipe.</p>
              )}
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
