// This file handles all API endpoints related 
// to the database.

//livsmedelsverket API base URL
  const language = 2; // 1 = Swedish, 2 = English

const BASE_URL =
  "https://dataportal.livsmedelsverket.se/livsmedel/api/v1";

export async function getFoods() {
    const response = await fetch(
    `${BASE_URL}/livsmedel?offset=0&limit=10000&sprak=${language}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getDishes() {
  const data = await getFoods();

  return data.livsmedel.filter(
    (food: any) => food.livsmedelsTypId === 2
  );
}

export async function getIngredients(id: number) {
  const response = await fetch(
    `${BASE_URL}/livsmedel/${id}/ingredienser?sprak=${language}`
  )

  if (!response.ok) {
    console.log(`No ingredients found for ${id}`)
    return []
  }

  return response.json()
}
