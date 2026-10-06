"""Fetch food and ingredient data from the Swedish Food Agency API."""

import json
from pathlib import Path
from typing import Any, TypedDict
from urllib.parse import urlencode
from urllib.request import urlopen


BASE_URL = "https://dataportal.livsmedelsverket.se/livsmedel/api/v1"


class Ingredient(TypedDict):
	nummer: int
	namn: str | None
	viktForeTillagning: int | float | None
	viktEfterTillagning: int | float | None
	tillagningsfaktor: str | None


def _get_json(path: str, params: dict[str, int] | None = None) -> Any:
	query = f"?{urlencode(params)}" if params else ""
	with urlopen(f"{BASE_URL}{path}{query}", timeout=30) as response:
		return json.load(response)


def get_foods(offset: int = 0, limit: int = 10000) -> list[dict[str, Any]]:
	"""Return foods from the API catalogue."""
	data = _get_json("/livsmedel", {"offset": offset, "limit": limit, "sprak": 1})
	return data["livsmedel"]


def get_dishes() -> list[dict[str, Any]]:
	"""Return catalogue entries that are classified as dishes."""
	return [food for food in get_foods() if food.get("livsmedelsTypId") == 2]


def get_ingredients(dish_id: int) -> list[Ingredient]:
	"""Return the ingredients listed for one dish."""
	data = _get_json(f"/livsmedel/{dish_id}/ingredienser", {"sprak": 1})
	ingredients = data.get("value") if isinstance(data, dict) else data
	if not isinstance(ingredients, list):
		raise TypeError(
			f"Unexpected ingredients response for dish {dish_id}: "
			f"expected a list or an object containing a 'value' list"
		)
	return [
		{
			"nummer": ingredient["nummer"],
			"namn": ingredient.get("namn"),
			"viktForeTillagning": ingredient.get("viktForeTillagning"),
			"viktEfterTillagning": ingredient.get("viktEfterTillagning"),
			"tillagningsfaktor": ingredient.get("tillagningsfaktor"),
		}
		for ingredient in ingredients
	]


def save_all_ingredients(output_path: str | Path | None = None) -> int:
	"""Save each dish and its ingredients as readable text."""
	dishes = get_dishes()
	path = Path(output_path) if output_path else Path(__file__).with_name("ingredients.txt")
	ingredient_count = 0
	with path.open("w", encoding="utf-8") as output:
		for dish in dishes:
			output.write(f"{dish['nummer']}: {dish.get('namn', 'Unnamed dish')}\n")
			ingredients = get_ingredients(dish["nummer"])
			if ingredients:
				for ingredient in ingredients:
					name = ingredient.get("namn") or "Unnamed ingredient"
					output.write(f"  - {ingredient['nummer']}: {name}\n")
				ingredient_count += len(ingredients)
			else:
				output.write("  - No ingredients listed\n")
			output.write("\n")
	return ingredient_count


if __name__ == "__main__":
	ingredient_count = save_all_ingredients()
	output_path = Path(__file__).with_name("ingredients.txt")
	print(f"Saved {ingredient_count} dish ingredients to {output_path}.")
