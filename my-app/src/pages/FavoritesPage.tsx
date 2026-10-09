
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getFavorites, removeFavorite } from "../services/favorites";
import type { Dish } from "../types/food";

import "./FavoritesPage.css";

function FavoritesPage() {
  const [favorites, setFavorites] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Load saved recipes from Firebase when the page opens
  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      try {
        const savedRecipes = await getFavorites();

        // Avoid duplicates from older Firestore document IDs
        const uniqueRecipes = Array.from(
          new Map(
            savedRecipes.map((dish) => [dish.nummer, dish])
          ).values()
        );

        if (active) {
          setFavorites(uniqueRecipes);
        }
      } catch (err) {
        console.error("Failed to load favorites:", err);

        if (active) {
          setError("Could not load your favorite recipes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, []);

  // Remove a recipe from Firestore
  async function handleRemove(dish: Dish) {
    setRemovingId(dish.nummer);
    setError("");

    try {
      await removeFavorite(dish);

      // Update the page without reloading
      setFavorites((current) =>
        current.filter((item) => item.nummer !== dish.nummer)
      );
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      setError("Could not remove the recipe.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="favorites-page">
      <header className="favorites-header">
        <Link to="/" className="favorites-back">
          ← Home
        </Link>

        <h1>❤️ My Favorite Recipes</h1>
        <p>All your saved recipes in one place.</p>

        <Link to="/recipes" className="favorites-explore">
          Explore Recipes
        </Link>
      </header>

      {error && (
        <p className="favorites-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="favorites-message">
          Loading your favorite recipes...
        </p>
      ) : favorites.length === 0 && !error ? (
        <div className="favorites-empty">
          <h2>No favorites yet!</h2>
          <p>
            Explore recipes and save the ones you like.
          </p>

          <Link to="/recipes" className="favorites-explore">
            Find Recipes
          </Link>
        </div>
      ) : (
        <>
          <p className="favorites-count">
            You have {favorites.length} saved recipes
          </p>

          <div className="favorites-grid">
            {favorites.map((dish) => (
              <article
                key={dish.nummer}
                className="favorite-recipe-card"
              >
                <h2>{dish.namn}</h2>

                <details className="favorite-ingredients">
                  <summary>View Ingredients</summary>

                  {dish.ingredients?.length > 0 ? (
                    <ul>
                      {dish.ingredients.map((ingredient, index) => (
                        <li key={`${ingredient.nummer}-${index}`}>
                          {ingredient.namn}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No ingredients saved for this recipe.</p>
                  )}
                </details>

                <button
                  type="button"
                  className="favorite-remove-button"
                  disabled={removingId === dish.nummer}
                  onClick={() => handleRemove(dish)}
                >
                  {removingId === dish.nummer
                    ? "Removing..."
                    : "♥ Remove Favorite"}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default FavoritesPage;
