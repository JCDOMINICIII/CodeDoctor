from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os
import json


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ==========================================
# CHECK API KEY
# ==========================================

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")


# ==========================================
# GEMINI CLIENT
# ==========================================

client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        # Local React
        "http://localhost:5173",
        "http://localhost:5174",

        # Local React using 127.0.0.1
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",

        # LIVE REACT FRONTEND
        "https://codedoctor-uejj.onrender.com",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==========================================
# REQUEST MODEL
# ==========================================

class DebugRequest(BaseModel):
    code: str
    language: str = "javascript"


class DebugResponse(BaseModel):
    problem: str
    explanation: str
    fixed_code: str
    concept: str
    learning_tip: str


# ==========================================
# HOME / HEALTH CHECK
# ==========================================

@app.get("/")
def home():

    return {
        "message": "CodeDoctor API is running!"
    }


# ==========================================
# DEBUG CODE
# ==========================================

@app.post("/analyze", response_model=DebugResponse)
def debug_code(request: DebugRequest):

    # Check code
    if not request.code.strip():

        raise HTTPException(
            status_code=400,
            detail="Please provide some code to debug."
        )


    # ======================================
    # PROMPT
    # ======================================

    prompt = f"""
You are CodeDoctor, an expert AI coding teacher and debugging assistant.

Analyze the following {request.language} code carefully.

IMPORTANT RULES:

1. Find ALL actual errors in the code, including:
   - syntax errors
   - spelling mistakes
   - undefined variables
   - incorrect function or method names
   - incorrect operators
   - incorrect logic
   - type errors
   - runtime errors
   - incorrect API usage

2. Do NOT invent errors that are not present in the code.

3. Only identify something as an error if it is actually incorrect
for {request.language}.

4. The fixed_code must be a complete, working correction of the
user's code.

5. Preserve the user's original intention whenever possible.

6. If there are multiple errors, identify and fix ALL of them.

7. Explain everything in beginner-friendly language.

8. If the code is already correct, clearly say that there are no
errors and return the original code as fixed_code.

IMPORTANT:
Return ONLY valid JSON.

Do not use Markdown.
Do not use code fences.
Do not add any text before or after the JSON.

The JSON MUST have exactly these fields:

{{
  "problem": "What is wrong with the code.",
  "explanation": "Why the problem happens.",
  "fixed_code": "The complete corrected code.",
  "concept": "The main programming concept involved.",
  "learning_tip": "One useful learning tip."
}}

USER'S CODE:

{request.code}
"""


    # ======================================
    # SEND TO GEMINI
    # ======================================

    try:

        response = client.chat.completions.create(
            model="gemini-3.5-flash-lite",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"}
        )

        raw_analysis = response.choices[0].message.content

        try:
            parsed_analysis = json.loads(raw_analysis)

            validated_analysis = DebugResponse(
                **parsed_analysis
            )

        except (json.JSONDecodeError, TypeError, ValueError) as error:
            print("Invalid AI response:", error)

            raise HTTPException(
                status_code=500,
                detail="CodeDoctor received an invalid response from the AI."
            )

        return validated_analysis

    except Exception as error:
        print("Error generating debug response:", error)

        raise HTTPException(
            status_code=500,
            detail="An error occurred while debugging the code."
        ) from error