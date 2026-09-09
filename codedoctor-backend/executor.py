import subprocess
import sys
import tempfile
import os
import shutil


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

    node_executable = shutil.which("node")

    if not node_executable:

        return {
            "success": False,
            "output": "",
            "error": "Node.js is not installed or not available in PATH."
        }

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
                node_executable,
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

    npx_executable = shutil.which("npx")

    if not npx_executable:

        return {
            "success": False,
            "output": "",
            "error": "npx is not installed or not available in PATH."
        }

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
                npx_executable,
                "--yes",
                "tsx",
                temp_file
            ],
            timeout=30
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

    java_executable = shutil.which("java")
    javac_executable = shutil.which("javac")

    # ======================================
    # WINDOWS JDK FALLBACK
    # ======================================

    if not java_executable or not javac_executable:

        java_home = (
            r"C:\Program Files\Eclipse Adoptium"
            r"\jdk-21.0.12.101-hotspot"
        )

        java_executable = os.path.join(
            java_home,
            "bin",
            "java.exe"
        )

        javac_executable = os.path.join(
            java_home,
            "bin",
            "javac.exe"
        )

        if (
            not os.path.exists(java_executable)
            or not os.path.exists(javac_executable)
        ):

            return {
                "success": False,
                "output": "",
                "error": "Java JDK is not installed or not available."
            }

    temp_directory = tempfile.mkdtemp()

    java_file = os.path.join(
        temp_directory,
        "Main.java"
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

    # ======================================
    # WINDOWS + MSYS2 UCRT64
    # ======================================

    if os.name == "nt":

        bash_executable = r"C:\msys64\usr\bin\bash.exe"

        if not os.path.exists(bash_executable):

            return {
                "success": False,
                "output": "",
                "error": "MSYS2 Bash was not found."
            }

        with tempfile.TemporaryDirectory() as temp_dir:

            cpp_file = os.path.join(
                temp_dir,
                "main.cpp"
            )

            executable = os.path.join(
                temp_dir,
                "main.exe"
            )

            with open(
                cpp_file,
                "w",
                encoding="utf-8"
            ) as file:

                file.write(code)

            # Convert Windows paths to MSYS2 paths
            temp_dir_msys = temp_dir.replace("\\", "/")

            cpp_file_msys = cpp_file.replace("\\", "/")
            executable_msys = executable.replace("\\", "/")

            # Example:
            # C:/Users/USER/AppData/Local/Temp/abc
            # becomes:
            # /c/Users/USER/AppData/Local/Temp/abc

            if len(cpp_file_msys) >= 2 and cpp_file_msys[1] == ":":
                cpp_file_msys = (
                    "/"
                    + cpp_file_msys[0].lower()
                    + cpp_file_msys[2:]
                )

            if len(executable_msys) >= 2 and executable_msys[1] == ":":
                executable_msys = (
                    "/"
                    + executable_msys[0].lower()
                    + executable_msys[2:]
                )

            # ==================================
            # COMPILE + RUN INSIDE UCRT64
            # ==================================

            command = (
                "export PATH=/ucrt64/bin:/usr/bin:$PATH && "
                f"g++ '{cpp_file_msys}' -o '{executable_msys}' && "
                f"'{executable_msys}'"
            )

            return run_process(
                [
                    bash_executable,
                    "-lc",
                    command
                ],
                timeout=30
            )

    # ======================================
    # LINUX / OTHER SYSTEMS
    # ======================================

    gpp_executable = shutil.which("g++")

    if not gpp_executable:

        return {
            "success": False,
            "output": "",
            "error": "C++ compiler (g++) is not installed or not available in PATH."
        }

    with tempfile.TemporaryDirectory() as temp_dir:

        cpp_file = os.path.join(
            temp_dir,
            "main.cpp"
        )

        executable = os.path.join(
            temp_dir,
            "main"
        )

        with open(
            cpp_file,
            "w",
            encoding="utf-8"
        ) as file:

            file.write(code)

        compile_result = run_process(
            [
                gpp_executable,
                cpp_file,
                "-o",
                executable
            ],
            timeout=30
        )

        if not compile_result["success"]:

            return compile_result

        return run_process(
            [
                executable
            ],
            timeout=5
        )
# ==========================================
# MAIN LANGUAGE ROUTER
# ==========================================

def run_code(code: str, language: str):

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