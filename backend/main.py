
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recipe_classifier import classify_recipe

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

class RecipeRequest(BaseModel):
    title: str
    ingredients: list[str]


@app.post("/classify")
def classify(data: RecipeRequest):
    try:
        return classify_recipe(
            data.title,
            data.ingredients
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Recipe classification failed"
        )
