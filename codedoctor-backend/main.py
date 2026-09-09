from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")

client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

app = FastAPI(
    title="CodeDoctor API",
    description="AI-powered coding debugger and teacher",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://codedoctor-uejj.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DebugRequest(BaseModel):
    code: str
    language: str = "javascript"


class DebugResponse(BaseModel):
    problem: str
    explanation: str
    fixed_code: str
    concept: str
    learning_tip: str


@app.get("/")
def home():
    return {
        "message": "CodeDoctor API is running!",
        "version": "2.0.0",
        "status": "online"
    }


@app.post("/analyze", response_model=DebugResponse)
def analyze_code(request: DebugRequest):

    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide some code to debug."
        )

    supported_languages = {
        "javascript",
        "python",
        "typescript",
        "java",
        "c++"
    }

    language = request.language.lower().strip()

    if language not in supported_languages:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {request.language}"
        )

    prompt = f"""
You are CodeDoctor, an expert AI coding teacher and debugging assistant.

Analyze the user's {language} code carefully.

Your job is to:

1. Find the actual programming errors.
2. Explain why they happen.
3. Understand the user's apparent intention.
4. Make the smallest logical correction.
5. Return the complete corrected code.
6. Teach the programming concept involved.

IMPORTANT RULES:

- Do NOT invent errors.
- Do NOT invent arbitrary values.
- Do NOT randomly rewrite working code.
- Preserve the user's original structure and intention whenever possible.
- Make the smallest correction necessary.

VERY IMPORTANT:

When you find an undefined variable, inspect the rest of the code.

If there is an existing variable that clearly appears to be what
the user intended to reference, use that existing variable.

For example:

const x = 10;
console.log(y);

The problem is that y was never defined.

Because x is already defined and is clearly the variable being used
in this simple example, the obvious correction is:

const x = 10;
console.log(x);

DO NOT change it to:

const x = 10;
const y = 20;
console.log(y);

That would invent information that the user never provided.

Another example:

let username = "Jethro";
console.log(user);

The obvious correction is:

let username = "Jethro";
console.log(username);

However, if there are multiple possible variables and the intended
correction cannot reasonably be determined, do not invent a value.
Explain the ambiguity instead.

If the code is already correct:

problem should be:
"No errors found."

fixed_code should contain the original code unchanged.

If there are multiple errors, identify and fix the errors that can
reasonably be determined from the code.

Only apply rules appropriate to {language}.

Explain everything in beginner-friendly language.

Return ONLY valid JSON.

Do not use Markdown.
Do not use code fences.
Do not add anything before or after the JSON.

Return exactly this structure:

{{
    "problem": "What is wrong with the code.",
    "explanation": "Why the problem happens and how to understand it.",
    "fixed_code": "The complete corrected code.",
    "concept": "The main programming concept involved.",
    "learning_tip": "One useful learning tip."
}}

USER'S CODE:

{request.code}
"""

    try:

        response = client.chat.completions.create(
            model="gemini-3.5-flash-lite",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={
                "type": "json_object"
            }
        )

        raw_analysis = response.choices[0].message.content

        if not raw_analysis:
            raise HTTPException(
                status_code=500,
                detail="CodeDoctor received an empty response from the AI."
            )

        try:
            parsed_analysis = json.loads(raw_analysis)

        except json.JSONDecodeError as error:
            print("Invalid AI JSON response:", error)
            print("Raw response:", raw_analysis)

            raise HTTPException(
                status_code=500,
                detail="CodeDoctor received an invalid response from the AI."
            )

        try:
            validated_analysis = DebugResponse(**parsed_analysis)

        except (TypeError, ValueError) as error:
            print("Invalid response structure:", error)
            print("Parsed response:", parsed_analysis)

            raise HTTPException(
                status_code=500,
                detail="CodeDoctor received an incomplete response from the AI."
            )

        return validated_analysis

    except HTTPException:
        raise

    except Exception as error:
        print("Error generating debug response:", error)

        raise HTTPException(
            status_code=500,
            detail="An error occurred while debugging the code."
        ) from error