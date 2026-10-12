import './Cook.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getFavorites } from '../services/favorites';
import {
  generateRecipe,
  describeRecipeError,
  type GeneratedRecipe,
} from '../services/recipes';
import type { Dish } from '../types/food';

type FavoriteRecipe = {
  id: string;
  name: string;
  ingredients: string[]; // ["Potatis höst rå - 630 g", "Lök gul - 95 g", ...]
};

// Turn a saved Dish (from users/{uid}/favorites) into what the page needs
function toFavoriteRecipe(dish: Dish): FavoriteRecipe {
  const ingredients = (dish.ingredients ?? [])
    .filter((ing) => ing.namn)
    .map((ing) =>
      ing.viktForeTillagning != null
        ? `${ing.namn} - ${ing.viktForeTillagning} g`
        : `${ing.namn}`
    );

  return { id: String(dish.nummer), name: dish.namn, ingredients };
}

export default function Cook() {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState('');
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});

  // Cache so re-selecting a recipe doesn't spend another API call
  const [cache, setCache] = useState<Record<string, GeneratedRecipe>>({});

  // 1. Load favorites once Firebase has told us who is logged in
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) {
          setFavorites([]);
          setFavoritesLoading(false);
        }
        return;
      }

      try {
        const saved = await getFavorites();

        // Same de-duplication as FavoritesPage (old docs used the recipe number as ID)
        const unique = Array.from(
          new Map(saved.map((dish) => [dish.nummer, dish])).values()
        );

        if (active) {
          setFavorites(unique.map(toFavoriteRecipe));
          setFavoritesError(null);
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
        if (active) setFavoritesError('Could not load your favorite recipes.');
      } finally {
        if (active) setFavoritesLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const selected = favorites.find((r) => r.id === selectedId) ?? null;

  // 2. Generate instructions for the selected recipe
  const load = async (target: FavoriteRecipe, force = false) => {
    setDone({});
    setGenError(null);

    if (!force && cache[target.id]) {
      setRecipe(cache[target.id]);
      return;
    }

    setRecipe(null);
    setGenerating(true);
    try {
      const result = await generateRecipe(target.name, target.ingredients.join(', '));
      setCache((c) => ({ ...c, [target.id]: result }));
      setRecipe(result);
    } catch (err) {
      console.error('Recipe generation failed:', err);
      setGenError(describeRecipeError(err));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!selected) {
      setRecipe(null);
      setGenError(null);
      return;
    }
    load(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <main className="cook-page">
      <header className="cook-header">
        <div>
          <Link to="/" className="cook-back">
            ← Home
          </Link>
          <h1 className="cook-title">Cook</h1>
          <p className="cook-subtitle">Pick one of your favorites and we'll walk you through it.</p>
        </div>
      </header>

      {favoritesLoading && (
        <div className="cook-loading">
          <p>Loading your favorites...</p>
        </div>
      )}

      {favoritesError && (
        <div className="cook-error" role="alert">
          <p>{favoritesError}</p>
        </div>
      )}

      {!favoritesLoading && !favoritesError && favorites.length === 0 && (
        <div className="cook-empty">
          <h2>No favorites yet!</h2>
          <p>Save some recipes first and they'll show up here.</p>
          <Link to="/recipes" className="cook-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Find Recipes
          </Link>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="cook-picker cook-card">
          <label htmlFor="favorite-recipe">Choose a favorite recipe</label>
          <select
            id="favorite-recipe"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select a recipe</option>
            {favorites.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selected && (
        <section className="cook-selected">
          <h2 className="cook-section-title">{selected.name}</h2>

          {recipe && (
            <div className="recipe-meta">
              <span>⏱️ Prep: {recipe.prepTime}</span>
              <span>🍳 Cook: {recipe.cookTime}</span>
            </div>
          )}

          <div className="cook-layout">
            {/* Left: instructions */}
            <div className="instructions-card">
              <h2 className="cook-section-title">Instructions</h2>

              {generating && <p>Writing your instructions...</p>}

              {genError && (
                <div className="cook-error" role="alert">
                  <p>{genError}</p>
                  <button type="button" onClick={() => load(selected, true)}>
                    Try again
                  </button>
                </div>
              )}

              {recipe && (
                <>
                  <ol className="instructions-list">
                    {recipe.instructions.map((step, i) => (
                      <li
                        key={`${selected.id}-${i}`}
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
                    <button type="button" onClick={() => load(selected, true)}>
                      Regenerate
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right: ingredients (available immediately, no need to wait for the AI) */}
            <aside className="ingredients-card">
              <h2 className="cook-section-title">Ingredients</h2>
              {selected.ingredients.length > 0 ? (
                <ul className="ingredients-list">
                  {selected.ingredients.map((ing, i) => (
                    <li key={`${ing}-${i}`}>{ing}</li>
                  ))}
                </ul>
              ) : (
                <p>No ingredients saved for this recipe.</p>
              )}
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}