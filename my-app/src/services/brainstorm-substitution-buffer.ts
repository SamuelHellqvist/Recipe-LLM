import catalogUrl from "../../substitutioner.json?url";
import { getDeselectedIngredients } from "./deselected-ingridients";
import { getSubstitutionList } from "./substitutions";
import {
  findIngredientsMatchingSubstitutions,
  suggestIngredientSubstitutes,
} from "./recipes";
import type { Ingredient } from "../types/food";

export type IngredientReplacement = {
  name: string;
  ratio: string;
  note: string;
  source: "catalog" | "ai";
};

export type IngredientReplacementGroup = {
  ingredient: Ingredient;
  replacements: IngredientReplacement[];
};

type CatalogSubstitute = {
  ingrediens: string;
  forhallande?: string;
  kommentar?: string;
};

type CatalogIngredient = {
  namn: string;
  substitut: CatalogSubstitute[];
};

type SubstitutionCatalog = {
  ingredienser: Record<string, CatalogIngredient>;
};

let catalogRequest: Promise<SubstitutionCatalog> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCatalogSubstitute(value: unknown): value is CatalogSubstitute {
  return (
    isRecord(value) &&
    typeof value.ingrediens === "string" &&
    (value.forhallande === undefined ||
      typeof value.forhallande === "string") &&
    (value.kommentar === undefined || typeof value.kommentar === "string")
  );
}

function isCatalogIngredient(value: unknown): value is CatalogIngredient {
  return (
    isRecord(value) &&
    typeof value.namn === "string" &&
    Array.isArray(value.substitut) &&
    value.substitut.every(isCatalogSubstitute)
  );
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sv-SE")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function namesMatch(left: string, right: string): boolean {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;

  const leftWords = new Set(normalizedLeft.split(" "));
  const rightWords = normalizedRight.split(" ");
  return (
    rightWords.every((word) => leftWords.has(word)) ||
    [...leftWords].every((word) => rightWords.includes(word))
  );
}

async function loadCatalog(): Promise<SubstitutionCatalog> {
  if (!catalogRequest) {
    catalogRequest = fetch(catalogUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Could not load the substitution catalog (${response.status}).`
          );
        }

        const value: unknown = await response.json();
        if (!isRecord(value) || !isRecord(value.ingredienser)) {
          throw new Error("The substitution catalog has an invalid format.");
        }

        const ingredienser: Record<string, CatalogIngredient> = {};
        for (const [id, ingredient] of Object.entries(value.ingredienser)) {
          if (!isCatalogIngredient(ingredient)) {
            throw new Error("The substitution catalog has an invalid format.");
          }
          ingredienser[id] = ingredient;
        }

        return { ingredienser };
      })
      .catch((error: unknown) => {
        catalogRequest = null;
        throw error;
      });
  }

  return catalogRequest;
}

function findCatalogIngredient(
  ingredient: Ingredient,
  catalog: SubstitutionCatalog
): CatalogIngredient | undefined {
  return (
    catalog.ingredienser[String(ingredient.nummer)] ??
    Object.values(catalog.ingredienser).find((entry) =>
      ingredient.namn ? namesMatch(entry.namn, ingredient.namn) : false
    )
  );
}

function isDeselected(ingredient: Ingredient, deselected: Ingredient[]): boolean {
  return deselected.some(
    (item) =>
      item.nummer === ingredient.nummer ||
      (Boolean(item.namn) &&
        Boolean(ingredient.namn) &&
        namesMatch(item.namn!, ingredient.namn!))
  );
}

export async function loadBrainstormPreferences(
  userId: string
): Promise<{ deselected: Ingredient[]; substitutions: string[] }> {
  const [deselected, substitutions] = await Promise.all([
    getDeselectedIngredients(),
    getSubstitutionList(userId),
  ]);

  return { deselected, substitutions: substitutions ?? [] };
}

export async function getIngredientReplacementGroups(
  dishName: string,
  ingredients: Ingredient[],
  deselected: Ingredient[],
  userSubstitutions: string[]
): Promise<IngredientReplacementGroup[]> {
  const substitutionMatches =
    userSubstitutions.length > 0
      ? await findIngredientsMatchingSubstitutions(
          dishName,
          ingredients
            .filter((ingredient): ingredient is Ingredient & { namn: string } =>
              Boolean(ingredient.namn)
            )
            .map(({ nummer, namn }) => ({ nummer, namn })),
          userSubstitutions
        )
      : [];
  const matchedNumbers = new Set(substitutionMatches);
  const targets = ingredients.filter(
    (ingredient) =>
      matchedNumbers.has(ingredient.nummer) ||
      isDeselected(ingredient, deselected)
  );
  if (targets.length === 0) return [];

  const catalog = await loadCatalog();

  return Promise.all(
    targets.map(async (ingredient) => {
      const catalogIngredient = findCatalogIngredient(ingredient, catalog);
      const catalogReplacements = catalogIngredient?.substitut.map(
        (substitute) => ({
          name: substitute.ingrediens,
          ratio: substitute.forhallande ?? "Adjust to taste",
          note: substitute.kommentar ?? "",
          source: "catalog" as const,
        })
      );

      if (catalogReplacements && catalogReplacements.length > 0) {
        return { ingredient, replacements: catalogReplacements };
      }

      if (!ingredient.namn) {
        throw new Error(
          `Cannot find a replacement for ingredient ${ingredient.nummer}.`
        );
      }

      const suggestions = await suggestIngredientSubstitutes(
        dishName,
        ingredient.namn
      );

      if (suggestions.length === 0) {
        throw new Error(
          `No replacement suggestions were found for ${ingredient.namn}.`
        );
      }

      return {
        ingredient,
        replacements: suggestions.map((suggestion) => ({
          ...suggestion,
          source: "ai" as const,
        })),
      };
    })
  );
}
