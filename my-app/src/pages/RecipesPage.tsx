// to displays recipes to users.


import { useEffect, useRef, useState } from "react";
import { getDishes, getIngredients } from "../services/api";
import FavoriteButton from "../components/FavoriteButton";
import type { Food, Ingredient } from "../types/food";
import "./RecipesPage.css";

function RecipesPage() {
  const [dishes, setDishes] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [error, setError] = useState("");
  const [ingredientError, setIngredientError] = useState("");

  const requestId = useRef(0);
  const itemsPerPage = 12;

  // 1. Fetch all dish names from the API
  useEffect(() => {
    let active = true;

    async function loadDishes() {
      try {
        const data: Food[] = await getDishes();

        if (active) {
          setDishes(data);
        }
      } catch (error) {
        console.error("Error fetching dishes:", error);

        if (active) {
          setError("Could not load dishes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDishes();

    return () => {
      active = false;
    };
  }, []);

  // 2. Reset currently opened dish
  function closeDish() {
    requestId.current++;
    setSelectedId(null);
    setIngredients([]);
    setLoadingIngredients(false);
    setIngredientError("");
  }

  // 3. Fetch ingredients only when a dish is opened
  async function toggleIngredients(dish: Food) {
    if (selectedId === dish.nummer) {
      closeDish();
      return;
    }

    const thisRequest = ++requestId.current;

    setSelectedId(dish.nummer);
    setIngredients([]);
    setLoadingIngredients(true);
    setIngredientError("");

    try {
      const data: Ingredient[] = await getIngredients(dish.nummer);

      if (thisRequest === requestId.current) {
        setIngredients(data);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);

      if (thisRequest === requestId.current) {
        setIngredientError("Could not load ingredients.");
      }
    } finally {
      if (thisRequest === requestId.current) {
        setLoadingIngredients(false);
      }
    }
  }

  // 4. Search by dish name
  const searchTerm = search.trim().toLocaleLowerCase("sv-SE");

  const filteredDishes = dishes.filter((dish) =>
    dish.namn.toLocaleLowerCase("sv-SE").includes(searchTerm)
  );

  // 5. Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDishes.length / itemsPerPage)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentDishes = filteredDishes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  function changePage(page: number) {
    setCurrentPage(page);
    closeDish();
  }

  return (
    <main className="recipes-page">
      <header className="recipes-header">
        <h1>Explore Recipes</h1>
        <p>Find something delicious to cook today!</p>
      </header>

      {/* SEARCH */}
      <div className="recipe-search">
        <input
          type="search"
          placeholder="Search recipes, e.g. kyckling, pasta..."
          aria-label="Search recipes"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
            closeDish();
          }}
        />

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setCurrentPage(1);
            closeDish();
          }}
        >
          All Recipes
        </button>
      </div>

      {/* RESULTS */}
      {loading ? (
        <p>Loading recipes...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <p className="results-count">
            Showing {filteredDishes.length} of {dishes.length} dishes
          </p>

          {filteredDishes.length === 0 && (
            <p>No recipes found. Try another search!</p>
          )}

          <div className="recipes-grid">
            {currentDishes.map((dish) => (
              <article className="recipe-card" key={dish.nummer}>
                <h2>{dish.namn}</h2>
                
                <FavoriteButton dish={dish} />

                {dish.tillagningsmetod && (
                  <p className="recipe-category">
                    {dish.tillagningsmetod}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => toggleIngredients(dish)}
                >
                  {selectedId === dish.nummer
                    ? "Hide Ingredients"
                    : "View Ingredients"}
                </button>

                {selectedId === dish.nummer && (
                  <div className="recipe-ingredients">
                    <h3>Ingredients</h3>

                    {loadingIngredients ? (
                      <p>Loading ingredients...</p>
                    ) : ingredientError ? (
                      <p role="alert">{ingredientError}</p>
                    ) : ingredients.length === 0 ? (
                      <p>No ingredients available.</p>
                    ) : (
                      <ul>
                        {ingredients.map((ingredient, index) => (
                          <li key={`${ingredient.nummer}-${index}`}>
                            {ingredient.namn ?? "Unknown ingredient"}

                            {ingredient.viktForeTillagning != null
                              ? ` - ${ingredient.viktForeTillagning} g`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => changePage(currentPage - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => changePage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default RecipesPage;
