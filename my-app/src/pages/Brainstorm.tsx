import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import FavoriteButton from '../components/FavoriteButton';
import { getDishes, getIngredients } from '../services/api';
import {
  getIngredientReplacementGroups,
  loadBrainstormPreferences,
  type IngredientReplacementGroup,
} from '../services/brainstorm-substitution-buffer';
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

function formatIngredients(
  ingredientData: Ingredient[],
  replacementGroups: IngredientReplacementGroup[],
  replacementChoices: Record<number, string>
): string[] {
  return ingredientData
    .map((ingredient) => {
      const group = replacementGroups.find(
        (candidate) => candidate.ingredient.nummer === ingredient.nummer
      );
      const replacement = group?.replacements.find(
        (candidate) => candidate.name === replacementChoices[ingredient.nummer]
      );

      return replacement
        ? `${replacement.name} instead of ${ingredient.namn} (${replacement.ratio})`
        : formatIngredient(ingredient);
    })
    .filter(Boolean);
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
  const [searchParams] = useSearchParams();
  const dishName = searchParams.get("name") ?? "";

  const [prompt, setPrompt] = useState(dishName);

  const [dishes, setDishes] = useState<Food[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [finding, setFinding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matchedDish, setMatchedDish] = useState<Food | null>(null);
  const [matchReason, setMatchReason] = useState('');
  const [ingredientData, setIngredientData] = useState<Ingredient[]>([]);
  const [replacementGroups, setReplacementGroups] = useState<
    IngredientReplacementGroup[]
  >([]);
  const [replacementChoices, setReplacementChoices] = useState<
    Record<number, string>
  >({});
  const [deselectedLoading, setDeselectedLoading] = useState(true);
  const [deselectedError, setDeselectedError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [pendingReplacements, setPendingReplacements] = useState(false);
  const [deselectedIngredients, setDeselectedIngredients] = useState<
    Ingredient[]
  >([]);
  const [userSubstitutions, setUserSubstitutions] = useState<string[]>([]);

  const requestId = useRef(0);

  const allReplacementsChosen = replacementGroups.every(
    (group) =>
      group.replacements.length === 1 ||
      Boolean(replacementChoices[group.ingredient.nummer])
  );

  useEffect(() => {
    let active = true;
    let currentRequest = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        const thisRequest = ++currentRequest;
        ++requestId.current;
        setIsSignedIn(Boolean(user));
        setDeselectedLoading(true);
        setDeselectedError(null);
        setDeselectedIngredients([]);
        setUserSubstitutions([]);
        setMatchedDish(null);
        setIngredientData([]);
        setReplacementGroups([]);
        setReplacementChoices({});
        setPendingReplacements(false);
        setRecipe(null);
        setDone({});

        if (!user) {
          setDeselectedLoading(false);
          return;
        }

        try {
          const preferences = await loadBrainstormPreferences(user.uid);
          if (active && thisRequest === currentRequest) {
            setDeselectedIngredients(preferences.deselected);
            setUserSubstitutions(preferences.substitutions);
          }
        } catch (err) {
          console.error('Failed to load deselected ingredients:', err);
          if (active && thisRequest === currentRequest) {
            setDeselectedError(
              'Could not load your excluded ingredients. Sign in again and retry.'
            );
          }
        } finally {
          if (active && thisRequest === currentRequest) {
            setDeselectedLoading(false);
          }
        }
      },
      (err) => {
        ++currentRequest;
        console.error('Failed to check sign-in status:', err);
        if (active) {
          setDeselectedError('Could not check your sign-in status.');
          setDeselectedLoading(false);
        }
      }
    );

    return () => {
      active = false;
      ++currentRequest;
      unsubscribe();
    };
  }, []);

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
    if (!text || deselectedLoading || deselectedError) return;

    const thisRequest = ++requestId.current;
    setFinding(true);
    setGenerating(false);
    setPendingReplacements(false);
    setError(null);
    setMatchedDish(null);
    setMatchReason('');
    setIngredientData([]);
    setReplacementGroups([]);
    setReplacementChoices({});
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

      const replacementGroups =
        deselectedIngredients.length > 0 || userSubstitutions.length > 0
          ? await getIngredientReplacementGroups(
              dish.namn,
              ingredientData,
              deselectedIngredients,
              userSubstitutions
            )
          : [];
      if (thisRequest !== requestId.current) return;

      const initialChoices: Record<number, string> = {};
      for (const group of replacementGroups) {
        if (group.replacements.length === 1) {
          initialChoices[group.ingredient.nummer] = group.replacements[0].name;
        }
      }

      setMatchedDish(dish);
      setMatchReason(match.reason);
      setIngredientData(ingredientData);
      setReplacementGroups(replacementGroups);
      setReplacementChoices(initialChoices);
      setFinding(false);

      if (replacementGroups.some((group) => group.replacements.length > 1)) {
        setPendingReplacements(true);
        return;
      }

      await loadInstructions(
        dish,
        formatIngredients(ingredientData, replacementGroups, initialChoices),
        thisRequest
      );
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
    if (
      finding ||
      generating ||
      catalogLoading ||
      deselectedLoading ||
      deselectedError
    ) {
      return;
    }
    findAndLoad(prompt);
  };

  const generateWithChosenReplacements = () => {
    if (!matchedDish || !allReplacementsChosen || finding || generating) return;

    setPendingReplacements(false);
    setRecipe(null);
    setError(null);
    setDone({});
    void loadInstructions(
      matchedDish,
      formatIngredients(ingredientData, replacementGroups, replacementChoices),
      requestId.current
    );
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
        {deselectedLoading && <p>Loading your excluded ingredients...</p>}
        {!deselectedLoading && !isSignedIn && (
          <p>Sign in to apply your saved excluded ingredients.</p>
        )}
        {!deselectedLoading && userSubstitutions.length > 0 && (
          <p>
            Avoiding: {userSubstitutions.join(', ')}
          </p>
        )}
        {deselectedError && (
          <p className="cook-error-text" role="alert">
            {deselectedError}
          </p>
        )}
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
          <button
            type="submit"
            disabled={
              finding ||
              generating ||
              catalogLoading ||
              deselectedLoading ||
              Boolean(deselectedError)
            }
          >
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
          <FavoriteButton dish={matchedDish}
            instructions={recipe?.instructions.join("\n") ?? ""}
          />

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
                        loadInstructions(
                          matchedDish,
                          formatIngredients(
                            ingredientData,
                            replacementGroups,
                            replacementChoices
                          ),
                          thisRequest
                        );
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
              {ingredientData.length > 0 ? (
                <ul className="ingredients-list">
                  {ingredientData.map((ingredient, index) => {
                    const group = replacementGroups.find(
                      (candidate) =>
                        candidate.ingredient.nummer === ingredient.nummer
                    );
                    const chosenReplacement = group?.replacements.find(
                      (replacement) =>
                        replacement.name ===
                        replacementChoices[ingredient.nummer]
                    );

                    return (
                      <li key={`${ingredient.nummer}-${index}`}>
                        {group ? (
                          <>
                            <s>{formatIngredient(ingredient)}</s>
                            {chosenReplacement ? (
                              <p>
                                <strong>{chosenReplacement.name}</strong>
                                {` — ${chosenReplacement.ratio}`}
                                {chosenReplacement.note
                                  ? ` (${chosenReplacement.note})`
                                  : ''}
                                <small>
                                  {chosenReplacement.source === 'catalog'
                                    ? ' From substitution catalog'
                                    : ' AI suggestion'}
                                </small>
                              </p>
                            ) : (
                              <p className="cook-error-text">
                                Choose a replacement before generating the recipe.
                              </p>
                            )}
                            {group.replacements.length > 1 && (
                              <label>
                                Choose a replacement for {ingredient.namn}
                                <select
                                  value={
                                    replacementChoices[ingredient.nummer] ?? ''
                                  }
                                  onChange={(event) =>
                                    setReplacementChoices((current) => ({
                                      ...current,
                                      [ingredient.nummer]: event.target.value,
                                    }))
                                  }
                                >
                                  <option value="" disabled>
                                    Select a replacement
                                  </option>
                                  {group.replacements.map((replacement) => (
                                    <option
                                      key={replacement.name}
                                      value={replacement.name}
                                    >
                                      {replacement.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </>
                        ) : (
                          formatIngredient(ingredient)
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No ingredients listed for this recipe.</p>
              )}
              {pendingReplacements && (
                <div className="cook-actions">
                  <p>Choose a replacement for each excluded ingredient.</p>
                  <button
                    type="button"
                    disabled={!allReplacementsChosen || generating}
                    onClick={generateWithChosenReplacements}
                  >
                    Generate recipe with replacements
                  </button>
                </div>
              )}
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
