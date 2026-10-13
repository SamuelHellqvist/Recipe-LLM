# Recipe-LLM Backend

Python backend for the TNM114 Recipe-LLM project at Linköping University.

The backend uses **FastAPI** and **Groq AI** to classify recipes based on their names and ingredients. The classifications can be used by the React frontend to organize and filter recipes.

## Technologies

- Python 3.9+
- FastAPI
- Groq API (`openai/gpt-oss-20b`)
- Uvicorn
- python-dotenv

## Project Structure

```text
backend/
├── main.py                # FastAPI application and endpoints
├── recipe_classifier.py   # Groq AI classification logic
├── test_classifier.py     # Test script
├── requirements.txt       # Python dependencies
├── .env.example           # Example environment configuration
├── .env                   # API key (not committed)
└── .venv/                 # Virtual environment (not committed)
```

## Setup

### 1. Navigate to the backend directory

Open a terminal in the project folder:

```bash
cd backend
```

### 2. Create a virtual environment

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell):**

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file inside the `backend` directory.

Add:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

The API key can be obtained from [Groq Cloud](https://console.groq.com/keys).

**Important:** Never commit the `.env` file or share API keys publicly.

The current classifier uses the `openai/gpt-oss-20b` model directly in `recipe_classifier.py`. The `GROQ_MODEL` variable is optional unless the code is updated to read it.

## Running the Backend

Make sure the virtual environment is activated.

From the `backend` directory, run:

```bash
python -m uvicorn main:app --reload --port 8000
```

The backend will be available at:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

Keep the terminal running while using the AI classification feature.

## API Endpoints

### POST /classify

Classifies a recipe using Groq AI.

**Request:**

```json
{
  "title": "Creamy Chicken Pasta",
  "ingredients": [
    "chicken",
    "pasta",
    "cream",
    "garlic",
    "parmesan"
  ]
}
```

**Example response:**

```json
{
  "cuisine": "Italian",
  "meal_type": ["Dinner"],
  "main_ingredient": "chicken",
  "diet": []
}
```

The classification contains:

| Field | Description |
|---|---|
| `cuisine` | Predicted culinary tradition |
| `meal_type` | Breakfast, Lunch, Dinner, Snack, or Dessert |
| `main_ingredient` | Main ingredient identified by the AI |
| `diet` | Vegetarian or Vegan when applicable |

Classifications are AI predictions and may not always be accurate. Dietary labels should be verified against ingredient information.

## Testing

Run the classifier test from the `backend` directory:

```bash
python test_classifier.py
```

Alternatively, open:

http://127.0.0.1:8000/docs

Select `POST /classify`, click **Try it out**, enter a recipe, and click **Execute**.

A successful request returns HTTP status `200`.

## Frontend Integration

The frontend is built with React, TypeScript, and Vite.

The frontend sends requests to:

```text
http://127.0.0.1:8000/classify
```

To start the frontend, open another terminal:

```bash
cd my-app
npm install
npm run dev
```

Run this from the root `Recipe-LLM` directory.

The frontend will normally be available at:

http://localhost:5173

Both servers must be running for live AI classification.

## Troubleshooting

**ModuleNotFoundError**

Make sure the virtual environment is activated and run:

```bash
python -m pip install -r requirements.txt
```

**KeyError: 'GROQ_API_KEY'**

Check that `backend/.env` exists and contains a valid Groq API key.

**Connection refused**

Make sure FastAPI is running on port 8000.

**CORS error**

Check that the React frontend origin matches an allowed origin in `main.py`. The current configuration allows `http://localhost:5173`.

**Groq API error**

Check your API key, internet connection, and access to the selected model.

## Security

- Store the API key only in the backend `.env` file.
- Do not expose API keys in React environment variables prefixed with `VITE_`.
- Do not commit `.env`, `.venv`, or Python cache files.
- The current backend is intended for local development. Add appropriate authentication, rate limiting, and deployment configuration before exposing it publicly.

## Future Improvements

- Store recipe classifications in Firebase Firestore.
- Add category-based filtering to the React frontend.
- Cache classifications to reduce unnecessary Groq API calls.
- Improve classification consistency with structured output validation.
- Integrate nutritional information from Livsmedelsverket.

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Groq Documentation](https://console.groq.com/docs/overview)
- [Python Virtual Environments](https://docs.python.org/3/library/venv.html)
