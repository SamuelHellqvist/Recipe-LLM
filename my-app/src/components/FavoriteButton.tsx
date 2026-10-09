
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";

import { auth } from "../services/firebase";
import {
    saveFavorite,
    removeFavorite,
    isFavorite,
} from "../services/favorites";

import { getIngredients } from "../services/api";
import type { Food } from "../types/food";

type Props = {
    dish: Food;
};

function FavoriteButton({ dish }: Props) {
    const navigate = useNavigate();

    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");

    // Check if the user has already saved this recipe
    useEffect(() => {
        let active = true;
        let version = 0;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            const currentVersion = ++version;
            setChecking(true);

            if (!user) {
                setSaved(false);
                setChecking(false);
                return;
            }

            try {
                const result = await isFavorite(dish);

                if (active && version === currentVersion) {
                    setSaved(result);
                }
            } catch (error) {
                console.error("Could not check favorite:", error);
            } finally {
                if (active && version === currentVersion) {
                    setChecking(false);
                }
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [dish.nummer, dish.namn]);

    async function handleFavorite() {
        // User must be signed in
        if (!auth.currentUser) {
            navigate("/login");
            return;
        }

        setLoading(true);
        setError("");

        try {
            if (saved) {
                // Remove saved recipe
                await removeFavorite(dish);
                setSaved(false);
            } else {
                // Fetch ingredients for this dish only
                const ingredients = await getIngredients(dish.nummer);

                // Save recipe with its ingredients
                await saveFavorite({
                    ...dish,
                    ingredients,
                });

                setSaved(true);
            }
        } catch (error) {
            console.error("Favorite error:", error);
            setError("Could not update favorite.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                className={`favorite-button ${saved ? "saved" : ""}`}
                onClick={handleFavorite}
                disabled={loading || checking}
                aria-pressed={saved}
            >
                {loading || checking ? (
                    "Loading..."
                ) : saved ? (
                    "♥ Saved"
                ) : (
                    "♡ Save"
                )}
            </button>

            {error && <p role="alert">{error}</p>}
        </div>
    );
}

export default FavoriteButton;
