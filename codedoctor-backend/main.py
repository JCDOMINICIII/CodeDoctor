from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os


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

@app.post("/debug")
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


3. Only claim something is an error if it is actually incorrect
for {request.language}.


4. The FIXED_CODE must be a complete, working correction
of the user's code.


5. Do not simply repeat the original code.


6. Carefully compare every:

   - variable name
   - function name
   - operator
   - punctuation mark
   - quote
   - bracket
   - method call

between the original code and the corrected code.


7. Preserve the user's original intention whenever possible.


8. If the code contains multiple errors, fix ALL of them.


9. Explain the errors in beginner-friendly language.


10. Do not overwhelm the user with unnecessary technical terms.


Return your answer in EXACTLY this format:

PROBLEM:
[List every actual problem found in the code.]

EXPLANATION:
[Explain clearly why each problem is wrong.]

FIXED_CODE:
[Provide the complete corrected code.]

CONCEPT:
[The main programming concept involved.]

LEARNING_TIP:
[One useful tip that will help the user avoid this type of mistake.]

ORIGINAL CODE:
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
            ]
        )


        # ==================================
        # GET AI RESPONSE
        # ==================================

        analysis = response.choices[0].message.content


        # ==================================
        # RETURN RESPONSE
        # ==================================

        return {
            "analysis": analysis
        }


    except Exception as error:

        print("Gemini API error:", error)


        raise HTTPException(

            status_code=500,

            detail=f"AI backend error: {str(error)}"
        )