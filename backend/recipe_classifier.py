
import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ["GROQ_API_KEY"])

def classify_recipe(title, ingredients):
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                                
                        
            "content": (
                "You are an expert in international cuisines "
                "and food classification. "

                "Analyze the recipe title and ingredients. "

                "Return ONLY valid JSON with these fields:\n"

                "cuisine: Identify the most likely culinary "
                "tradition associated with the dish. "
                "Examples include Italian, French, Greek, "
                "Swedish, Japanese, Chinese, Indian, "
                "Mexican, Turkish, Lebanese, American, "
                "and Mediterranean. "
                "You may use other established cuisines. "
                "Use 'Unknown' only when there is not enough "
                "information to determine a cuisine.\n"

                "meal_type: A list containing one or more of "
                "Breakfast, Lunch, Dinner, Snack, Dessert.\n"

                "main_ingredient: Identify the main ingredient.\n"

                "diet: A list containing Vegetarian or Vegan "
                "when clearly applicable, otherwise an empty list.\n"

                "Consider the traditional origin and preparation "
                "of the dish, but do not invent a country of origin."
            )

            },
            {
                "role": "user",
                "content": (
                    f"Recipe: {title}\n"
                    f"Ingredients: {json.dumps(ingredients)}"
                )
            }
        ],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)
