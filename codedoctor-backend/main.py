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
You are CodeDoctor, an AI coding teacher and debugging assistant.

Analyze the following {request.language} code.

Your job is to:

1. Identify the main bug or problem.
2. Explain clearly why it happens.
3. Provide corrected code.
4. Identify the programming concept involved.
5. Give one useful learning tip.

Be helpful to a beginner.
Do not just give the answer — teach the user.

Return your answer in exactly this format:

PROBLEM:
[what is wrong]

EXPLANATION:
[why it is wrong]

FIXED_CODE:
[corrected code]

CONCEPT:
[programming concept]

LEARNING_TIP:
[useful learning advice]

CODE:
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