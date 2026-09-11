import os
import json
import re
from typing import List, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

from executor import run_code


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")

client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

MODEL_NAME = "gemini-3.6-flash"


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="CodeDoctor API",
    version="3.1.1",
    description="AI coding debugger and programming tutor",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://codedoctor-uejj.onrender.com",
        "https://codedoctor-gnbw.onrender.com",
        "https://codedoctor-backend-docker.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODELS
# ============================================================

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


class AlternativeSolution(BaseModel):
    title: str
    description: str
    tradeoff: str = ""
    code: str = ""


class QualitySuggestion(BaseModel):
    area: str
    suggestion: str


class DebugResponse(BaseModel):
    problem: str
    explanation: str
    fixed_code: str

    concept: str
    learning_tip: str
    hint: str
    question: str

    diagnosisType: str
    severity: str
    location: str
    evidence: str

    debugSteps: List[str]

    rootCause: str
    fixSummary: str

    alternatives: List[AlternativeSolution]
    qualitySuggestions: List[QualitySuggestion]
    beginnerMistakes: List[str]

    expectedBehavior: str = ""
    actualBehavior: str = ""
    changeExplanation: str = ""
    runtimeContext: str = ""

    # ========================================================
    # AI SERVICE STATUS
    # ========================================================

    analysisStatus: str = "complete"
    analysisErrorType: str = ""
    analysisErrorMessage: str = ""
    retryAfterSeconds: int = 0


class EvaluateAnswerRequest(BaseModel):
    code: str
    language: str

    problem: str
    explanation: str

    learningAnswer: str

    diagnosisType: str = ""
    rootCause: str = ""

    debugSteps: List[str] = Field(default_factory=list)


# ============================================================
# CONSTANTS
# ============================================================

ALLOWED_LANGUAGES = {
    "javascript",
    "python",
    "typescript",
    "java",
    "c++",
}

ALLOWED_EXPLANATION_LEVELS = {
    "simple",
    "detailed",
    "expert",
}

ALLOWED_DIAGNOSES = {
    "Correct",
    "Syntax Error",
    "Runtime Error",
    "Type Error",
    "Logic Error",
    "Compilation Error",
    "Wrong Output",
    "Environment Error",
}

ALLOWED_SEVERITIES = {
    "Low",
    "Medium",
    "High",
}


CONCEPTS = {
    "javascript": [
        "Variables",
        "Data Types",
        "Operators",
        "Conditionals",
        "Functions",
        "Objects",
        "Arrays",
        "Loops",
        "DOM",
        "Events",
        "Async Programming",
        "Error Handling",
        "Modules",
        "Other",
    ],
    "python": [
        "Variables",
        "Data Types",
        "Operators",
        "Conditionals",
        "Functions",
        "Lists",
        "Dictionaries",
        "Loops",
        "Classes",
        "Modules",
        "Error Handling",
        "Other",
    ],
    "typescript": [
        "Variables",
        "Data Types",
        "Types",
        "Interfaces",
        "Operators",
        "Conditionals",
        "Functions",
        "Objects",
        "Arrays",
        "Loops",
        "Generics",
        "Async Programming",
        "Error Handling",
        "Other",
    ],
    "java": [
        "Variables",
        "Data Types",
        "Operators",
        "Conditionals",
        "Methods",
        "Classes",
        "Objects",
        "Arrays",
        "Loops",
        "Inheritance",
        "Exceptions",
        "Collections",
        "Other",
    ],
    "c++": [
        "Variables",
        "Data Types",
        "Operators",
        "Conditionals",
        "Functions",
        "Classes",
        "Objects",
        "Arrays",
        "Loops",
        "Pointers",
        "References",
        "STL",
        "Error Handling",
        "Other",
    ],
}


# ============================================================
# CLEANING / NORMALIZATION
# ============================================================

def clean_code_block(value: str) -> str:
    if not value:
        return ""

    value = str(value).strip()

    value = re.sub(
        r"^```[a-zA-Z0-9_+#-]*\s*",
        "",
        value,
    )

    value = re.sub(
        r"\s*```$",
        "",
        value,
    )

    return value.strip()


def extract_json(content: str) -> Any:
    content = content.strip()

    if content.startswith("```"):
        content = clean_code_block(content)

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    start = content.find("{")
    end = content.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("Gemini returned invalid JSON.")

    return json.loads(content[start:end + 1])


def normalize_language(language: str) -> str:
    value = (language or "javascript").strip().lower()

    aliases = {
        "js": "javascript",
        "javascript": "javascript",
        "py": "python",
        "python": "python",
        "ts": "typescript",
        "typescript": "typescript",
        "java": "java",
        "cpp": "c++",
        "c++": "c++",
        "cxx": "c++",
    }

    return aliases.get(value, value)


def normalize_explanation_level(level: str) -> str:
    value = (level or "detailed").strip().lower()

    if value not in ALLOWED_EXPLANATION_LEVELS:
        return "detailed"

    return value


def normalize_diagnosis(value: str) -> str:
    if not value:
        return "Logic Error"

    text = (
        str(value)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )

    aliases = {
        "correct": "Correct",
        "no error": "Correct",
        "no errors": "Correct",

        "syntax": "Syntax Error",
        "syntax error": "Syntax Error",
        "syntaxerror": "Syntax Error",

        "runtime": "Runtime Error",
        "runtime error": "Runtime Error",
        "runtimeerror": "Runtime Error",

        "type": "Type Error",
        "type error": "Type Error",
        "typeerror": "Type Error",

        "logic": "Logic Error",
        "logic error": "Logic Error",

        "compile": "Compilation Error",
        "compiler": "Compilation Error",
        "compiler error": "Compilation Error",
        "compilation": "Compilation Error",
        "compilation error": "Compilation Error",

        "wrong output": "Wrong Output",
        "wrongoutput": "Wrong Output",
        "output error": "Wrong Output",

        "environment": "Environment Error",
        "environment error": "Environment Error",
        "environmenterror": "Environment Error",
    }

    return aliases.get(text, "Logic Error")


def normalize_severity(value: str) -> str:
    text = str(value or "").strip().lower()

    if text == "low":
        return "Low"

    if text == "high":
        return "High"

    return "Medium"


def normalize_concept(value: str, language: str) -> str:
    concepts = CONCEPTS.get(
        language,
        CONCEPTS["javascript"],
    )

    if not value:
        return "Other"

    raw = str(value).strip().lower()

    aliases = {
        "variable": "Variables",
        "variables": "Variables",

        "datatype": "Data Types",
        "data type": "Data Types",
        "data types": "Data Types",

        "type": "Types",
        "types": "Types",

        "operator": "Operators",
        "operators": "Operators",

        "condition": "Conditionals",
        "conditional": "Conditionals",
        "conditionals": "Conditionals",

        "function": "Functions",
        "functions": "Functions",

        "method": "Methods",
        "methods": "Methods",

        "object": "Objects",
        "objects": "Objects",

        "array": "Arrays",
        "arrays": "Arrays",

        "list": "Lists",
        "lists": "Lists",

        "dictionary": "Dictionaries",
        "dictionaries": "Dictionaries",

        "loop": "Loops",
        "loops": "Loops",

        "dom": "DOM",

        "event": "Events",
        "events": "Events",

        "async": "Async Programming",
        "asynchronous": "Async Programming",

        "error": "Error Handling",
        "errors": "Error Handling",
        "error handling": "Error Handling",

        "class": "Classes",
        "classes": "Classes",

        "interface": "Interfaces",
        "interfaces": "Interfaces",

        "generic": "Generics",
        "generics": "Generics",

        "inheritance": "Inheritance",

        "exception": "Exceptions",
        "exceptions": "Exceptions",

        "collection": "Collections",
        "collections": "Collections",

        "pointer": "Pointers",
        "pointers": "Pointers",

        "reference": "References",
        "references": "References",

        "stl": "STL",

        "module": "Modules",
        "modules": "Modules",
    }

    normalized = aliases.get(
        raw,
        str(value).strip(),
    )

    for concept in concepts:
        if normalized.lower() == concept.lower():
            return concept

    return "Other"


def normalize_string_list(
    value: Any,
    maximum: int = 5,
) -> List[str]:

    if not isinstance(value, list):
        return []

    output = []

    for item in value[:maximum]:

        if isinstance(item, str):
            text = item.strip()

        elif isinstance(item, dict):
            text = str(
                item.get("suggestion")
                or item.get("description")
                or item.get("text")
                or ""
            ).strip()

        else:
            text = ""

        if text:
            output.append(text)

    return output


def normalize_alternatives(
    value: Any,
) -> List[AlternativeSolution]:

    if not isinstance(value, list):
        return []

    alternatives = []

    for item in value[:3]:

        if isinstance(item, str):

            alternatives.append(
                AlternativeSolution(
                    title="Alternative",
                    description=item.strip(),
                )
            )

            continue

        if not isinstance(item, dict):
            continue

        title = str(
            item.get("title")
            or "Alternative"
        ).strip()

        description = str(
            item.get("description")
            or item.get("explanation")
            or ""
        ).strip()

        tradeoff = str(
            item.get("tradeoff")
            or item.get("tradeoffs")
            or ""
        ).strip()

        code = clean_code_block(
            str(item.get("code") or "")
        )

        if description or code:

            alternatives.append(
                AlternativeSolution(
                    title=title,
                    description=description,
                    tradeoff=tradeoff,
                    code=code,
                )
            )

    return alternatives


def normalize_quality_suggestions(
    value: Any,
) -> List[QualitySuggestion]:

    if not isinstance(value, list):
        return []

    suggestions = []

    for item in value[:4]:

        if isinstance(item, str):

            text = item.strip()

            if text:
                suggestions.append(
                    QualitySuggestion(
                        area="General",
                        suggestion=text,
                    )
                )

            continue

        if not isinstance(item, dict):
            continue

        area = str(
            item.get("area")
            or "General"
        ).strip()

        suggestion = str(
            item.get("suggestion")
            or item.get("description")
            or ""
        ).strip()

        if suggestion:

            suggestions.append(
                QualitySuggestion(
                    area=area,
                    suggestion=suggestion,
                )
            )

    return suggestions


# ============================================================
# AI SERVICE ERROR HANDLING
# ============================================================

def extract_retry_after_seconds(exc: Exception) -> int:
    """
    Extract Gemini's retry delay from an API error.

    Examples:
    retry in 25.201174178s
    retryDelay: 25s
    retry in 39s
    """

    text = str(exc)

    patterns = [
        r"retry in\s+(\d+(?:\.\d+)?)s",
        r"retryDelay['\"]?\s*:\s*(\d+)s",
        r"retryDelay.*?(\d+)s",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            try:
                seconds = float(match.group(1))
                return max(1, round(seconds))

            except (TypeError, ValueError):
                pass

    return 0

def classify_ai_service_error(
    exc: Exception,
) -> str:

    status_code = getattr(
        exc,
        "status_code",
        None,
    )

    text = str(exc).lower()

    if (
        status_code == 429
        or "429" in text
        or "resource_exhausted" in text
        or "rate limit" in text
        or "quota exceeded" in text
        or "quota_exceeded" in text
    ):
        return "quota_exceeded"

    if (
        status_code == 401
        or status_code == 403
        or "invalid api key" in text
        or "api key not valid" in text
        or "authentication" in text
        or "unauthorized" in text
    ):
        return "authentication_error"

    if (
        status_code in {
            500,
            502,
            503,
            504,
        }
        or "internal server error" in text
        or "service unavailable" in text
        or "temporarily unavailable" in text
    ):
        return "service_unavailable"

    if (
        "timeout" in text
        or "timed out" in text
    ):
        return "timeout"

    return "unknown"


def friendly_ai_service_message(
    error_type: str,
) -> str:

    messages = {
        "quota_exceeded": (
            "CodeDoctor successfully ran your code, "
            "but the AI analysis service is temporarily "
            "unavailable because its API quota has been "
            "exceeded."
        ),

        "authentication_error": (
            "CodeDoctor successfully ran your code, "
            "but the AI analysis service could not "
            "authenticate with its API."
        ),

        "service_unavailable": (
            "CodeDoctor successfully ran your code, "
            "but the AI analysis service is temporarily "
            "unavailable."
        ),

        "timeout": (
            "CodeDoctor successfully ran your code, "
            "but the AI analysis service took too long "
            "to respond."
        ),

        "unknown": (
            "CodeDoctor successfully ran your code, "
            "but the AI analysis service could not "
            "complete the analysis."
        ),
    }

    return messages.get(
        error_type,
        messages["unknown"],
    )


# ============================================================
# EXECUTION / ERROR CLASSIFICATION
# ============================================================

def classify_execution_context(
    runtime_error: str,
    language: str,
) -> str:

    if not runtime_error:
        return ""

    error = runtime_error.lower()

    environment_signals = [
        "command not found",
        "not recognized as an internal",
        "no such file or directory",
        "permission denied",
        "permissionerror",
        "executable file not found",
        "runtime environment",
        "environment is unavailable",
        "environment unavailable",
        "cannot find module",
        "module not found",
        "modulenotfounderror",
        "npm err",
        "node_modules",
        "executable not found",
        "process exited",
        "process was terminated",
        "timeout",
        "timed out",
        "sandbox",
        "working directory",
        "interpreter not found",
        "compiler not found",
        "java not found",
        "javac not found",
        "g++ not found",
        "node not found",
        "python not found",
    ]

    for signal in environment_signals:

        if signal in error:
            return "Environment Error"

    return ""


def detect_runtime_diagnosis(
    runtime_error: str,
    language: str,
) -> str:

    if not runtime_error:
        return ""

    error = runtime_error.lower()

    environment = classify_execution_context(
        runtime_error,
        language,
    )

    if environment:
        return environment

    runtime_signals = [
        "typeerror",
        "referenceerror",
        "rangeerror",
        "urierror",
        "evalerror",
        "assignment to constant variable",
        "is not defined",
        "is not a function",
        "cannot read properties",
        "cannot set properties",
        "undefined is not",
        "uncaught",
        "nameerror",
        "valueerror",
        "indexerror",
        "keyerror",
        "attributeerror",
        "zerodivisionerror",
        "filenotfounderror",
        "importerror",
        "runtimeerror",
        "traceback",
        "nullpointerexception",
        "arrayindexoutofboundsexception",
        "numberformatexception",
        "arithmeticexception",
        "classcastexception",
        "illegalargumentexception",
        "exception in thread",
        "segmentation fault",
        "core dumped",
        "std::out_of_range",
        "std::invalid_argument",
    ]

    for signal in runtime_signals:

        if signal in error:
            return "Runtime Error"

    compiler_signals = [
        "syntaxerror",
        "syntax error",
        "compilation failed",
        "compilation error",
        "compile error",
        "cannot find symbol",
        "unexpected token",
        "unexpected end",
        "expected ';'",
        "expected ')'",
        "expected '}'",
        "expected expression",
        "parse error",
        "parseerror",
    ]

    for signal in compiler_signals:

        if signal in error:

            if language in {
                "java",
                "c++",
                "typescript",
            }:
                return "Compilation Error"

            return "Syntax Error"

    if "error:" in error:

        if language in {
            "java",
            "c++",
            "typescript",
        }:
            return "Compilation Error"

        return "Syntax Error"

    return "Runtime Error"


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "name": "CodeDoctor API",
        "status": "online",
        "version": "3.1.1",
    }


# ============================================================
# RUN CODE
# ============================================================

@app.post(
    "/run",
    response_model=RunResponse,
)
def run(request: RunRequest):

    language = normalize_language(
        request.language
    )

    if language not in ALLOWED_LANGUAGES:

        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {request.language}",
        )

    if not request.code.strip():

        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty.",
        )

    try:

        result = run_code(
            request.code,
            language,
        )

        if isinstance(result, dict):

            return RunResponse(
                success=bool(
                    result.get(
                        "success",
                        False,
                    )
                ),
                output=str(
                    result.get(
                        "output",
                        "",
                    )
                    or ""
                ),
                error=str(
                    result.get(
                        "error",
                        "",
                    )
                    or ""
                ),
            )

        return RunResponse(
            success=True,
            output=str(result),
            error="",
        )

    except Exception as exc:

        print(
            "RUN ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to run code: {str(exc)}",
        )


# ============================================================
# AI ANALYSIS
# ============================================================

@app.post(
    "/analyze",
    response_model=DebugResponse,
)
def analyze(request: DebugRequest):

    language = normalize_language(
        request.language
    )

    explanation_level = normalize_explanation_level(
        request.explanationLevel
    )

    if language not in ALLOWED_LANGUAGES:

        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {request.language}",
        )

    if not request.code.strip():

        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty.",
        )

    runtime_output = (
        request.runtimeOutput or ""
    ).strip()

    runtime_error = (
        request.runtimeError or ""
    ).strip()

    detected_diagnosis = detect_runtime_diagnosis(
        runtime_error,
        language,
    )

    runtime_context = f"""
ACTUAL EXECUTION OUTPUT:
{runtime_output if runtime_output else "(none)"}

ACTUAL EXECUTION ERROR:
{runtime_error if runtime_error else "(none)"}
""".strip()

    prompt = f"""
You are CodeDoctor 3.1, an expert programming
debugger and patient programming teacher.

You must diagnose the user's actual code.

Your job is to:

1. Identify the real problem.
2. Explain exactly why it happened.
3. Identify where it happened.
4. Use actual execution evidence when supplied.
5. Produce valid corrected code.
6. Explain what changed.
7. Give useful alternative approaches when appropriate.
8. Separate correctness problems from code-quality advice.
9. Identify relevant beginner mistakes.
10. Teach the developer how to recognize the problem again.

LANGUAGE:
{language}

EXPLANATION LEVEL:
{explanation_level}

USER CODE:
{request.code}

{runtime_context}

============================================================
AUTHORITATIVE EVIDENCE
============================================================

The actual runtime/compiler information above is
stronger evidence than speculation.

If an actual runtime error exists:
- diagnose that actual error first.
- do not replace it with a guessed logic problem.

If the runtime failure is caused by the execution
environment rather than the user's code:
- diagnosisType MUST be "Environment Error".
- explain that the environment is the problem.
- do not invent a code fix.

Environment problems include things such as:
- missing interpreter
- missing compiler
- missing executable
- unavailable package/module
- permission problems
- unavailable runtime
- sandbox/execution infrastructure failures
- configuration failures

If code executes successfully but produces output that
clearly conflicts with the intended behavior:
- use "Wrong Output" when the intended behavior can be
  reasonably inferred.
- do not invent an expected output if the intention cannot
  be inferred.

Use "Logic Error" when the problem is in the program's
reasoning/conditions/calculations but the output itself
is not the main diagnostic evidence.

Use "Type Error" when incompatible types are the actual
cause.

Use "Syntax Error" for invalid syntax.

Use "Compilation Error" for compiler-level failures.

Use "Runtime Error" for genuine execution failures caused
by the program.

If the code is correct:
- diagnosisType MUST be "Correct".
- fixed_code MUST equal the original code.
- do not invent a bug.
- do not invent a fix.

============================================================
FIX RULES
============================================================

fixed_code must be complete valid {language} code.

Preserve the user's structure wherever possible.

Fix only the actual problem.

Do not perform unrelated refactoring.

Do not invent:
- variables
- libraries
- APIs
- functions
- files
- requirements

============================================================
EXPLANATION
============================================================

Explain:

What happened?
Why did it happen?
Where did it happen?
Why does the language behave this way?
How can the developer recognize this mistake later?

Match the requested explanation level.

============================================================
DEBUGGING PROCESS
============================================================

Provide 3-6 useful debugging steps.

These should teach a repeatable debugging process.

Do not simply repeat the final fix.

============================================================
ALTERNATIVES
============================================================

Return 0-3 alternatives.

Only return alternatives when genuinely useful.

Each must contain:
- title
- description
- tradeoff
- code when appropriate

============================================================
CODE QUALITY
============================================================

Return 0-4 suggestions.

Quality suggestions are NOT bugs.

Only mention useful improvements involving:
- readability
- naming
- structure
- maintainability
- duplication
- clarity

============================================================
BEGINNER MISTAKES
============================================================

Return 0-3 mistakes that are directly relevant to this
code and problem.

Do not invent generic mistakes that are unrelated.

============================================================
LEARNING MODE
============================================================

The hint and question must help the developer reason
toward the answer.

They must NOT directly reveal the corrected code.

============================================================
CONTROLLED CONCEPT
============================================================

Choose exactly one concept from:

JavaScript:
{", ".join(CONCEPTS["javascript"])}

Python:
{", ".join(CONCEPTS["python"])}

TypeScript:
{", ".join(CONCEPTS["typescript"])}

Java:
{", ".join(CONCEPTS["java"])}

C++:
{", ".join(CONCEPTS["c++"])}

============================================================
JSON RESPONSE
============================================================

Return ONLY valid JSON:

{{
    "problem": "short description",

    "explanation": "complete explanation",

    "fixed_code": "complete corrected code",

    "concept": "one controlled concept",

    "learning_tip": "useful teaching tip",

    "hint": "hint without revealing the fix",

    "question": "thinking question without revealing the fix",

    "diagnosisType": "Correct | Syntax Error | Runtime Error | Type Error | Logic Error | Compilation Error | Wrong Output | Environment Error",

    "severity": "Low | Medium | High",

    "location": "specific location",

    "evidence": "specific evidence",

    "debugSteps": [
        "step 1",
        "step 2",
        "step 3"
    ],

    "rootCause": "underlying cause",

    "fixSummary": "what changed",

    "alternatives": [
        {{
            "title": "Alternative",
            "description": "description",
            "tradeoff": "trade-off",
            "code": "optional code"
        }}
    ],

    "qualitySuggestions": [
        {{
            "area": "Readability",
            "suggestion": "useful suggestion"
        }}
    ],

    "beginnerMistakes": [
        "relevant mistake"
    ],

    "expectedBehavior": "what the program should do, only if inferable",

    "actualBehavior": "what the program actually did",

    "changeExplanation": "specific explanation of code changes",

    "runtimeContext": "how runtime evidence affected the diagnosis"
}}

IMPORTANT:
- JSON only.
- No markdown.
- No invented errors.
- No invented runtime evidence.
- Runtime/compiler evidence has priority.
- Do not call style problems bugs.
- Do not force alternatives.
- Correct code must remain unchanged.
"""

    # ========================================================
    # GEMINI CALL
    # ========================================================

    try:

        if not GEMINI_API_KEY:

            raise HTTPException(
                status_code=500,
                detail=(
                    "GEMINI_API_KEY is not configured "
                    "on the backend."
                ),
            )

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are CodeDoctor. "
                        "Return only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.1,
        )

        content = (
            response.choices[0]
            .message.content
            or ""
        ).strip()

        data = extract_json(content)

    # ========================================================
    # GEMINI/API ERROR
    # ========================================================

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "ANALYZE ERROR:",
            repr(exc),
        )

        error_type = classify_ai_service_error(
            exc
        )

        retry_after = extract_retry_after_seconds(
            exc
        )

        friendly_message = friendly_ai_service_message(
            error_type
        )

        # ----------------------------------------------------
        # IMPORTANT:
        # Preserve the REAL PROGRAM diagnosis.
        # Gemini failing is NOT an Environment Error.
        # ----------------------------------------------------

        if detected_diagnosis:

            diagnosis = detected_diagnosis

        else:

            diagnosis = ""

        if runtime_error:

            problem = (
                "Your program produced a runtime error, "
                "but AI analysis is temporarily unavailable."
            )

            evidence = runtime_error

            actual_behavior = runtime_error

            root_cause = (
                "The program produced the runtime error "
                "shown above. AI root-cause analysis is "
                "temporarily unavailable."
            )

            runtime_context_result = (
                "The actual execution error was captured "
                "successfully, but the AI analysis service "
                "could not complete the deeper analysis."
            )

        elif runtime_output:

            problem = (
                "The program executed, but AI analysis "
                "is temporarily unavailable."
            )

            evidence = runtime_output

            actual_behavior = runtime_output

            root_cause = (
                "The program execution result was captured, "
                "but AI analysis is temporarily unavailable."
            )

            runtime_context_result = (
                "The actual execution output was captured "
                "successfully, but the AI analysis service "
                "could not complete the deeper analysis."
            )

        else:

            problem = (
                "AI analysis is temporarily unavailable."
            )

            evidence = (
                "No runtime evidence was available."
            )

            actual_behavior = ""

            root_cause = (
                "CodeDoctor could not complete AI analysis."
            )

            runtime_context_result = (
                "No runtime evidence was available before "
                "the AI analysis request failed."
            )

        retry_message = ""

        if retry_after > 0:

            retry_message = (
                f" You can try again in about "
                f"{retry_after} seconds."
            )

        return DebugResponse(
            problem=problem,

            explanation=(
                friendly_message
                + retry_message
            ),

            fixed_code="",

            concept="Other",

            learning_tip=(
                "Once the AI service is available, "
                "CodeDoctor can provide a deeper explanation "
                "and learning guidance."
            ),

            hint="",

            question="",

            diagnosisType=diagnosis,

            severity="Medium",

            location="",

            evidence=evidence,

            debugSteps=[
                "Read the actual execution error shown above.",
                "Locate the line and operation identified by the runtime.",
                "Inspect the values involved in that operation.",
                "Retry the AI analysis when the service is available.",
            ],

            rootCause=root_cause,

            fixSummary=(
                "CodeDoctor could not generate an AI correction "
                "because the analysis service is temporarily "
                "unavailable."
            ),

            alternatives=[],

            qualitySuggestions=[],

            beginnerMistakes=[],

            expectedBehavior="",

            actualBehavior=actual_behavior,

            changeExplanation="",

            runtimeContext=runtime_context_result,

            analysisStatus="unavailable",

            analysisErrorType=error_type,

            analysisErrorMessage=(
                friendly_message
                + retry_message
            ),

            retryAfterSeconds=retry_after,
        )

    # ========================================================
    # NORMAL AI RESPONSE
    # ========================================================

    ai_diagnosis = normalize_diagnosis(
        data.get(
            "diagnosisType",
            "",
        )
    )

    # Actual execution evidence wins.
    if detected_diagnosis:

        ai_diagnosis = detected_diagnosis

    fixed_code = clean_code_block(
        str(
            data.get(
                "fixed_code",
                "",
            )
            or ""
        )
    )

    if ai_diagnosis == "Correct":

        fixed_code = request.code

    problem = str(
        data.get("problem") or ""
    ).strip()

    explanation = str(
        data.get("explanation") or ""
    ).strip()

    concept = normalize_concept(
        str(
            data.get("concept") or ""
        ),
        language,
    )

    learning_tip = str(
        data.get("learning_tip") or ""
    ).strip()

    hint = str(
        data.get("hint") or ""
    ).strip()

    question = str(
        data.get("question") or ""
    ).strip()

    severity = normalize_severity(
        data.get(
            "severity",
            "",
        )
    )

    location = str(
        data.get("location") or ""
    ).strip()

    evidence = str(
        data.get("evidence") or ""
    ).strip()

    root_cause = str(
        data.get("rootCause") or ""
    ).strip()

    fix_summary = str(
        data.get("fixSummary") or ""
    ).strip()

    expected_behavior = str(
        data.get("expectedBehavior") or ""
    ).strip()

    actual_behavior = str(
        data.get("actualBehavior") or ""
    ).strip()

    change_explanation = str(
        data.get("changeExplanation") or ""
    ).strip()

    runtime_context_result = str(
        data.get("runtimeContext") or ""
    ).strip()

    debug_steps = normalize_string_list(
        data.get("debugSteps"),
        maximum=6,
    )

    alternatives = normalize_alternatives(
        data.get("alternatives")
    )

    quality_suggestions = normalize_quality_suggestions(
        data.get("qualitySuggestions")
    )

    beginner_mistakes = normalize_string_list(
        data.get("beginnerMistakes"),
        maximum=3,
    )

    # ========================================================
    # AUTHORITATIVE RUNTIME PROTECTION
    # ========================================================

    if detected_diagnosis:

        ai_diagnosis = detected_diagnosis

        if runtime_error:

            evidence = runtime_error

    # ========================================================
    # FALLBACKS
    # ========================================================

    if not problem:

        if ai_diagnosis == "Correct":

            problem = "No error detected."

        elif ai_diagnosis == "Environment Error":

            problem = (
                "The execution environment prevented "
                "the program from running correctly."
            )

        else:

            problem = (
                "The code contains an issue."
            )

    if not explanation:

        explanation = (
            "CodeDoctor identified the issue from "
            "the submitted code and available "
            "execution evidence."
        )

    if not learning_tip:

        learning_tip = (
            "Read the error carefully, locate where "
            "it happened, and trace the values involved."
        )

    if not hint:

        hint = (
            "Look closely at the operation connected "
            "to the reported problem."
        )

    if not question:

        question = (
            "What was the program trying to do at "
            "the location identified by the diagnosis?"
        )

    if not location:

        location = (
            "See the location identified by the "
            "execution error or code analysis."
        )

    if not evidence:

        if runtime_error:

            evidence = runtime_error

        elif runtime_output:

            evidence = runtime_output

        else:

            evidence = (
                "Based on static analysis of the "
                "submitted code."
            )

    if not root_cause:

        root_cause = problem

    if not fix_summary:

        if ai_diagnosis == "Correct":

            fix_summary = (
                "No changes were necessary."
            )

        elif ai_diagnosis == "Environment Error":

            fix_summary = (
                "No code change was required because "
                "the execution environment caused the failure."
            )

        else:

            fix_summary = (
                "The corrected code addresses the "
                "identified problem."
            )

    if not change_explanation:

        change_explanation = fix_summary

    if not debug_steps:

        debug_steps = [
            "Read the reported error or output carefully.",
            "Locate the relevant code and values.",
            "Compare the actual behavior with the intended behavior.",
            "Trace the operation that caused the problem.",
        ]

    if runtime_output:

        if not actual_behavior:

            actual_behavior = runtime_output

    if runtime_error:

        if not actual_behavior:

            actual_behavior = runtime_error

        if not runtime_context_result:

            runtime_context_result = (
                "The analysis used the actual execution "
                "error as primary evidence."
            )

    # Environment errors should not receive fake alternatives.
    if ai_diagnosis == "Environment Error":

        alternatives = []

    return DebugResponse(
        problem=problem,

        explanation=explanation,

        fixed_code=fixed_code,

        concept=concept,

        learning_tip=learning_tip,

        hint=hint,

        question=question,

        diagnosisType=ai_diagnosis,

        severity=severity,

        location=location,

        evidence=evidence,

        debugSteps=debug_steps,

        rootCause=root_cause,

        fixSummary=fix_summary,

        alternatives=alternatives,

        qualitySuggestions=quality_suggestions,

        beginnerMistakes=beginner_mistakes,

        expectedBehavior=expected_behavior,

        actualBehavior=actual_behavior,

        changeExplanation=change_explanation,

        runtimeContext=runtime_context_result,

        analysisStatus="complete",

        analysisErrorType="",

        analysisErrorMessage="",

        retryAfterSeconds=0,
    )


# ============================================================
# EVALUATE LEARNING MODE ANSWER
# ============================================================

@app.post("/evaluate-answer")
def evaluate_answer(
    request: EvaluateAnswerRequest,
):

    language = normalize_language(
        request.language
    )

    if language not in ALLOWED_LANGUAGES:

        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {request.language}",
        )

    if not request.learningAnswer.strip():

        raise HTTPException(
            status_code=400,
            detail="Learning answer cannot be empty.",
        )

    prompt = f"""
You are CodeDoctor, a patient programming teacher.

Evaluate whether the student actually understands the
coding problem.

LANGUAGE:
{language}

ORIGINAL CODE:
{request.code}

PROBLEM:
{request.problem}

CODEDOCTOR EXPLANATION:
{request.explanation}

DIAGNOSIS:
{request.diagnosisType}

ROOT CAUSE:
{request.rootCause}

DEBUGGING STEPS:
{json.dumps(request.debugSteps)}

STUDENT ANSWER:
{request.learningAnswer}

Focus on:

- technical understanding
- causal reasoning
- identifying the actual problem
- understanding why it happened
- whether the explanation demonstrates transferable understanding

Do not judge grammar harshly.

Do not require the student to use exact wording.

A student can receive a high score if their explanation
uses different words but demonstrates the correct idea.

Score:

70-100 = CORRECT
40-69 = PARTIALLY_CORRECT
0-39 = INCORRECT

Return ONLY valid JSON:

{{
    "correct": true,
    "score": 0,
    "result": "CORRECT",
    "feedback": "useful feedback",
    "whatTheyGotRight": "what they understood",
    "whatTheyMissed": "what they missed",
    "nextHint": "helpful next hint",
    "question": "optional follow-up question"
}}
"""

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a patient programming "
                        "teacher. Return only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
        )

        content = (
            response.choices[0]
            .message.content
            or ""
        ).strip()

        result = extract_json(content)

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "EVALUATE ERROR:",
            repr(exc),
        )

        error_type = classify_ai_service_error(
            exc
        )

        retry_after = extract_retry_after_seconds(
            exc
        )

        message = friendly_ai_service_message(
            error_type
        )

        retry_message = ""

        if retry_after > 0:

            retry_message = (
                f" You can try again in about "
                f"{retry_after} seconds."
            )

        return {
            "correct": False,
            "score": 0,
            "result": "UNAVAILABLE",
            "feedback": (
                message
                + retry_message
            ),
            "whatTheyGotRight": "",
            "whatTheyMissed": "",
            "nextHint": "",
            "question": "",
            "analysisStatus": "unavailable",
            "analysisErrorType": error_type,
            "analysisErrorMessage": (
                message
                + retry_message
            ),
            "retryAfterSeconds": retry_after,
        }

    try:

        score = int(
            result.get(
                "score",
                0,
            )
        )

    except (
        TypeError,
        ValueError,
    ):

        score = 0

    score = max(
        0,
        min(
            100,
            score,
        ),
    )

    if score >= 70:

        calculated_result = "CORRECT"

    elif score >= 40:

        calculated_result = "PARTIALLY_CORRECT"

    else:

        calculated_result = "INCORRECT"

    returned_result = str(
        result.get(
            "result",
            calculated_result,
        )
    ).strip().upper()

    if returned_result not in {
        "CORRECT",
        "PARTIALLY_CORRECT",
        "INCORRECT",
    }:

        returned_result = calculated_result

    return {
        "correct": returned_result == "CORRECT",

        "score": score,

        "result": returned_result,

        "feedback": str(
            result.get("feedback") or ""
        ).strip(),

        "whatTheyGotRight": str(
            result.get("whatTheyGotRight") or ""
        ).strip(),

        "whatTheyMissed": str(
            result.get("whatTheyMissed") or ""
        ).strip(),

        "nextHint": str(
            result.get("nextHint") or ""
        ).strip(),

        "question": str(
            result.get("question") or ""
        ).strip(),

        "analysisStatus": "complete",

        "analysisErrorType": "",

        "analysisErrorMessage": "",

        "retryAfterSeconds": 0,
    }


# ============================================================
# LOCAL DEBUG INFORMATION
# ============================================================

if __name__ == "__main__":

    import uvicorn

    port = int(
        os.getenv(
            "PORT",
            "8000",
        )
    )

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )