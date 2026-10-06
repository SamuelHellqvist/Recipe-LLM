"""Fetch food and ingredient data from the Swedish Food Agency API."""

import json
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen


BASE_URL = "https://dataportal.livsmedelsverket.se/livsmedel/api/v1"


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


def get_ingredients(food_id: int) -> list[dict[str, Any]]:
	"""Return ingredients for one food or dish ID."""
	data = _get_json(f"/livsmedel/{food_id}/ingredienser", {"sprak": 1})
	return data.get("value", data)


def save_all_ingredients(output_path: str | Path | None = None) -> int:
	"""Save all individual food records, excluding calculated dishes, as text."""
	foods = [food for food in get_foods() if food.get("livsmedelsTypId") == 1]
	path = Path(output_path) if output_path else Path(__file__).with_name("ingredients.txt")
	with path.open("w", encoding="utf-8") as output:
		for food in foods:
			output.write(f"{food['nummer']}: {food.get('namn', 'Unnamed food')}\n")
	return len(foods)


if __name__ == "__main__":
	food_count = save_all_ingredients()
	output_path = Path(__file__).with_name("ingredients.txt")
	print(f"Saved {food_count} individual foods to {output_path}.")
