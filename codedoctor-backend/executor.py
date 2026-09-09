import subprocess
import sys
import tempfile
import os


# ==========================================
# GENERAL PROCESS RUNNER
# ==========================================

def run_process(command, timeout=5):
    """
    Run a command in a separate process and capture
    its output and error.
    """
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if result.returncode != 0:
            return {
                "success": False,
                "output": result.stdout,
                "error": result.stderr
            }

        return {
            "success": True,
            "output": result.stdout,
            "error": ""
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "output": "",
            "error": "Execution timed out. Your code took too long to finish."
        }

    except FileNotFoundError:
        return {
            "success": False,
            "output": "",
            "error": f"Required runtime or compiler was not found: {command[0]}"
        }

    except Exception as error:
        return {
            "success": False,
            "output": "",
            "error": str(error)
        }


# ==========================================
# PYTHON
# ==========================================

def run_python_code(code: str):
    """
    Execute Python code.
    """
    temp_file = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            delete=False,
            encoding="utf-8"
        ) as file:
            file.write(code)
            temp_file = file.name

        return run_process(
            [
                sys.executable,
                temp_file
            ]
        )

    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except OSError:
                pass


# ==========================================
# JAVASCRIPT
# ==========================================

def run_javascript_code(code: str):
    """
    Execute JavaScript using Node.js.
    """
    temp_file = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".js",
            delete=False,
            encoding="utf-8"
        ) as file:
            file.write(code)
            temp_file = file.name

        return run_process(
            [
                r"C:\Program Files\nodejs\node.exe",
                temp_file
            ]
        )

    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except OSError:
                pass


# ==========================================
# TYPESCRIPT
# ==========================================

def run_typescript_code(code: str):
    """
    Execute TypeScript using tsx through npx.
    """
    temp_file = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".ts",
            delete=False,
            encoding="utf-8"
        ) as file:
            file.write(code)
            temp_file = file.name

        return run_process(
            [
                r"C:\Program Files\nodejs\npx.cmd",
                "--yes",
                "tsx",
                temp_file
            ]
        )

    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except OSError:
                pass


# ==========================================
# JAVA
# ==========================================

def run_java_code(code: str):
    """
    Compile and execute Java code using JDK 21.
    """

    temp_directory = tempfile.mkdtemp()

    java_file = os.path.join(
        temp_directory,
        "Main.java"
    )

    java_executable = (
        r"C:\Program Files\Eclipse Adoptium"
        r"\jdk-21.0.12.101-hotspot"
        r"\bin\java.exe"
    )

    javac_executable = (
        r"C:\Program Files\Eclipse Adoptium"
        r"\jdk-21.0.12.101-hotspot"
        r"\bin\javac.exe"
    )

    try:
        with open(
            java_file,
            "w",
            encoding="utf-8"
        ) as file:
            file.write(code)

        compile_result = run_process(
            [
                javac_executable,
                java_file
            ]
        )

        if not compile_result["success"]:
            return compile_result

        return run_process(
            [
                java_executable,
                "-cp",
                temp_directory,
                "Main"
            ]
        )

    finally:
        try:
            for filename in os.listdir(temp_directory):

                file_path = os.path.join(
                    temp_directory,
                    filename
                )

                if os.path.isfile(file_path):
                    os.remove(file_path)

            os.rmdir(temp_directory)

        except OSError:
            pass


# ==========================================
# C++
# ==========================================

def run_cpp_code(code: str):
    """
    Compile and execute C++ code using
    MSYS2 UCRT64 GCC.
    """

    with tempfile.TemporaryDirectory() as temp_dir:

        cpp_file = os.path.join(
            temp_dir,
            "main.cpp"
        )

        executable = os.path.join(
            temp_dir,
            "main.exe"
        )

        # Write user's C++ code
        with open(
            cpp_file,
            "w",
            encoding="utf-8"
        ) as file:
            file.write(code)

        # Convert Windows paths to MSYS2 paths
        msys_cpp_file = cpp_file.replace("\\", "/")
        msys_executable = executable.replace("\\", "/")

        # Convert C:/... to /c/...
        if msys_cpp_file.startswith("C:/"):
            msys_cpp_file = "/c/" + msys_cpp_file[3:]

        if msys_executable.startswith("C:/"):
            msys_executable = "/c/" + msys_executable[3:]

        # MSYS2 Bash
        msys2_bash = r"C:\msys64\usr\bin\bash.exe"

        # Compile using UCRT64 GCC
        compile_command = (
            f'export PATH="/ucrt64/bin:/usr/bin:$PATH" && '
            f'g++ "{msys_cpp_file}" -o "{msys_executable}"'
        )

        compile_result = run_process(
            [
                msys2_bash,
                "-lc",
                compile_command
            ]
        )

        # Compilation failed
        if not compile_result["success"]:
            return {
                "success": False,
                "output": "",
                "error": (
                    compile_result["error"]
                    or compile_result["output"]
                    or "C++ compilation failed."
                )
            }

        # Run the compiled program THROUGH MSYS2 Bash
        run_command = (
            f'export PATH="/ucrt64/bin:/usr/bin:$PATH" && '
            f'"{msys_executable}"'
        )

        run_result = run_process(
            [
                msys2_bash,
                "-lc",
                run_command
            ]
        )

        return {
            "success": run_result["success"],
            "output": run_result["output"],
            "error": run_result["error"]
        }


# ==========================================
# MAIN LANGUAGE ROUTER
# ==========================================

def run_code(code: str, language: str):
    """
    Route the user's code to the correct
    language executor.
    """

    language = language.lower().strip()

    if language == "python":
        return run_python_code(code)

    if language == "javascript":
        return run_javascript_code(code)

    if language == "typescript":
        return run_typescript_code(code)

    if language == "java":
        return run_java_code(code)

    if language == "c++":
        return run_cpp_code(code)

    return {
        "success": False,
        "output": "",
        "error": f"Unsupported language: {language}"
    }