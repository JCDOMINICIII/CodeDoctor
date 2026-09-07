from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "https://codedoctor-uejj.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DebugRequest(BaseModel):
    code: str
    language: str = "javascript"


@app.get("/")
def home():
    return {"message": "CodeDoctor API is running!"}


@app.post("/debug")
def debug_code(request: DebugRequest):

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

3. Only claim something is an error if it is actually incorrect for {request.language}.

4. The FIXED_CODE must be a complete, working correction of the user's code.
   Do not simply repeat the original code.

5. Carefully compare every variable name, function name, operator,
   punctuation mark, quote, bracket, and method call between the
   original code and the corrected code.

6. Preserve the user's original intention whenever possible.

7. If the code contains multiple errors, fix ALL of them.

8. Explain the errors in beginner-friendly language.
   Do not overwhelm the user with unnecessary technical terms.

Return your answer in EXACTLY this format:

PROBLEM:
[List every actual problem found in the code.]

EXPLANATION:
[Explain clearly why each problem is wrong.]

FIXED_CODE:
[Provide the complete corrected code. Make sure this code is actually fixed.]

CONCEPT:
[The main programming concept involved.]

LEARNING_TIP:
[One useful tip that will help the user avoid this type of mistake.]

ORIGINAL CODE:
{request.code}
"""

    response = client.chat.completions.create(
        model="gemini-3.5-flash-lite",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return {
        "analysis": response.choices[0].message.content
    }