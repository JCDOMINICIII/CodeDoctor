from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from executor import run_code
import os
import json


# ==========================================
# ENVIRONMENT
# ==========================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")


# ==========================================
# AI CLIENT
# ==========================================

client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="CodeDoctor API",
    description="AI-powered coding debugger and teacher",
    version="2.0.0"
)


# ==========================================
# CORS
# ==========================================

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


# ==========================================
# REQUEST / RESPONSE MODELS
# ==========================================

class DebugRequest(BaseModel):
    code: str
    language: str = "javascript"
    explanationLevel: str = "detailed"
    runtimeOutput: str = ""
    runtimeError: str = ""


class RunRequest(BaseModel):
    code: str
    language: str = "python"


class RunResponse(BaseModel):
    success: bool
    output: str
    error: str


class DebugResponse(BaseModel):
    problem: str
    explanation: str
    fixed_code: str
    concept: str
    learning_tip: str
    hint: str
    question: str


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "CodeDoctor API is running!",
        "version": "2.0.0",
        "status": "online"
    }


# ==========================================
# RUN CODE
# ==========================================

@app.post("/run", response_model=RunResponse)
def run_code_endpoint(request: RunRequest):

    if not request.code.strip():

        raise HTTPException(
            status_code=400,
            detail="Please provide some code to run."
        )

    language = request.language.lower().strip()

    supported_languages = {
        "python",
        "javascript",
        "typescript",
        "java",
        "c++"
    }

    if language not in supported_languages:

        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {request.language}"
        )

    result = run_code(
        request.code,
        language
    )

    return result


# ==========================================
# ANALYZE / DEBUG CODE
# ==========================================

@app.post("/analyze", response_model=DebugResponse)
def analyze_code(request: DebugRequest):

    if not request.code.strip():

        raise HTTPException(
            status_code=400,
            detail="Please provide some code to debug."
        )

    # ==========================================
    # SUPPORTED LANGUAGES
    # ==========================================

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

    # ==========================================
    # EXPLANATION LEVEL
    # ==========================================

    explanation_level = request.explanationLevel.lower().strip()

    supported_explanation_levels = {
        "simple",
        "detailed",
        "expert"
    }

    if explanation_level not in supported_explanation_levels:

        explanation_level = "detailed"


    # ==========================================
    # RUNTIME CONTEXT
    # ==========================================

    runtime_context = ""

    if request.runtimeOutput.strip():

        runtime_context += f"""
RUNTIME OUTPUT:

{request.runtimeOutput}
"""

    if request.runtimeError.strip():

        runtime_context += f"""
RUNTIME ERROR:

{request.runtimeError}
"""

    if not runtime_context:

        runtime_context = """
No runtime information is available.

Analyze the source code itself.
"""


    # ==========================================
    # AI PROMPT
    # ==========================================

    prompt = f"""
You are CodeDoctor, an expert AI coding teacher and debugging assistant.

Analyze the user's {language} code carefully.

The user has selected the explanation level: {explanation_level}


==================================================
EXPLANATION LEVEL RULES
==================================================

If the explanation level is SIMPLE:

- Explain the problem as if teaching someone who is still learning
  programming basics.
- Use plain language.
- Avoid unnecessary technical terminology.
- Keep explanations easy to understand.

If the explanation level is DETAILED:

- Give a clear beginner-friendly explanation.
- Introduce the relevant programming terminology.
- Explain why the error happens.
- Explain how the corrected code solves the problem.

If the explanation level is EXPERT:

- Give a technically precise explanation.
- You may use advanced programming terminology.
- Explain scope, runtime behavior, execution, type systems,
  memory, language semantics, or other advanced concepts when
  relevant.
- Do not oversimplify technical details.

The explanation level should affect:

- explanation
- concept
- learning_tip


==================================================
RUNTIME INFORMATION
==================================================

{runtime_context}


==================================================
CRITICAL RUNTIME RULES
==================================================

Runtime information comes from actually executing the user's code.

If a RUNTIME ERROR is provided:

- The original user code MUST be treated as having an error.
- NEVER return "No errors found."
- NEVER claim that the original code runs successfully.
- The runtime error is strong evidence of a real problem.
- Diagnose the runtime error against the ORIGINAL USER'S CODE.
- Do not silently correct the code before diagnosing it.
- Explain the connection between the source code and the runtime error.
- The "problem" field must describe the actual error.
- The "fixed_code" field must contain the corrected complete code.
- Use the runtime error to help identify the smallest logical correction.

For example, if the user submits:

name = "Jethro"
print(nam)

and the runtime error says:

NameError: name 'nam' is not defined. Did you mean: 'name'?

Then the diagnosis should identify that:

- "name" was defined.
- "nam" was used later.
- "nam" does not exist.
- The likely intended variable is the existing "name".
- The smallest correction is:

name = "Jethro"
print(name)

Do NOT invent a new variable.

Do NOT change:

name = "Jethro"

into:

nam = "Jethro"

unless the user's code clearly indicates that this was intended.

The runtime error must be respected even if the AI can imagine a corrected
version of the code.


==================================================
SOURCE CODE ANALYSIS RULES
==================================================

Your job is to:

1. Find the actual programming errors.
2. Use runtime evidence when available.
3. Explain why they happen.
4. Understand the user's apparent intention.
5. Make the smallest logical correction.
6. Return the complete corrected code.
7. Teach the programming concept involved.
8. Create a useful tutor hint.
9. Create a question that helps the user reason about the bug.

IMPORTANT:

- Do NOT invent errors.
- Do NOT invent arbitrary values.
- Do NOT randomly rewrite working code.
- Preserve the user's original structure and intention whenever possible.
- Make the smallest correction necessary.
- Only apply rules appropriate to {language}.


==================================================
UNDEFINED VARIABLES
==================================================

When you find an undefined variable, inspect the rest of the code.

If there is an existing variable that clearly appears to be what
the user intended to reference, use that existing variable.

Example:

const x = 10;
console.log(y);

The problem is that y was never defined.

If x is clearly the variable the user intended to use, the obvious
correction is:

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


==================================================
TUTOR MODE
==================================================

Create a short "hint" that guides the user toward understanding
the problem without simply giving away the answer.

The hint should:

- Be useful to a beginner.
- Point the user toward the relevant part of the code.
- Encourage the user to think before looking at the fixed code.
- Never introduce information that does not exist in the user's code.

Create a "question" that makes the user think about the programming
concept involved.

The question should encourage the user to reason about the problem
rather than simply repeat the answer.


==================================================
CORRECT CODE
==================================================

Only return:

"No errors found."

when BOTH of the following are true:

1. The source code itself contains no detectable error.
2. There is NO runtime error provided.

If runtime information shows that the code failed, the code MUST NOT
be classified as correct.

If the code is genuinely correct and there is no runtime error:

problem should be:

"No errors found."

fixed_code should contain the original code unchanged.

For correct code, the hint and question should still teach something
useful about the code rather than pretending there is a bug.


==================================================
MULTIPLE ERRORS
==================================================

If there are multiple errors, identify and fix the errors that can
reasonably be determined from the code and runtime evidence.

Do not invent corrections for things that cannot reasonably be known.


==================================================
OUTPUT FORMAT
==================================================

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
    "learning_tip": "One useful learning tip.",
    "hint": "A short hint that guides the user toward the solution.",
    "question": "A question that makes the user think about the programming concept."
}}


==================================================
USER'S ORIGINAL CODE
==================================================

{request.code}
"""


    # ==========================================
    # CALL AI
    # ==========================================

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


        # ==========================================
        # PARSE JSON
        # ==========================================

        try:

            parsed_analysis = json.loads(raw_analysis)

        except json.JSONDecodeError as error:

            print(
                "Invalid AI JSON response:",
                error
            )

            print(
                "Raw response:",
                raw_analysis
            )

            raise HTTPException(
                status_code=500,
                detail="CodeDoctor received an invalid response from the AI."
            )


        # ==========================================
        # VALIDATE RESPONSE
        # ==========================================

        try:

            validated_analysis = DebugResponse(
                **parsed_analysis
            )

        except (TypeError, ValueError) as error:

            print(
                "Invalid response structure:",
                error
            )

            print(
                "Parsed response:",
                parsed_analysis
            )

            raise HTTPException(
                status_code=500,
                detail="CodeDoctor received an incomplete response from the AI."
            )


        return validated_analysis


    # ==========================================
    # ERROR HANDLING
    # ==========================================

    except HTTPException:

        raise


    except Exception as error:

        print(
            "Error generating debug response:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="An error occurred while debugging the code."
        ) from error