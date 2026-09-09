import { useState } from 'react';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isDebugging, setIsDebugging] = useState(false);
  const [result, setResult] = useState(null);

  const debugCode = async () => {
    if (!code.trim()) {
      return;
    }

    setIsDebugging(true);
    setResult(null);

    try {
      const response = await fetch(
        'https://codedoctor-gnbw.onrender.com/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to analyze code.'
        );
      }

      // Backend now returns structured JSON.
      // No more splitting AI text with .split().
      setResult({
        problem: data.problem,
        explanation: data.explanation,
        fixedCode: data.fixed_code,
        concept: data.concept,
        learningTip: data.learning_tip,
      });

    } catch (error) {
      console.error('CodeDoctor Error:', error);

      setResult({
        problem: 'Something went wrong.',
        explanation:
          error.message ||
          'CodeDoctor could not connect to the AI backend.',
        fixedCode: '',
        concept: 'Connection Error',
        learningTip:
          'Check the backend and try again.',
      });

    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="app">

      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">🐛</span>
          <span>CodeDoctor</span>
        </div>

        <div className="nav-right">
          <button>History</button>
          <button>Settings</button>
        </div>
      </nav>

      <main className="main-content">

        <section className="hero">
          <p className="eyebrow">
            AI DEVELOPER ASSISTANT
          </p>

          <h1>
            Don't just fix your code.
            <span> Understand it.</span>
          </h1>

          <p className="subtitle">
            Paste your code, find the bug, and learn why it happened.
          </p>
        </section>

        <section className="workspace">

          {/* LEFT PANEL */}
          <div className="panel">

            <div className="panel-header">
              <div>
                <span className="panel-title">
                  Your Code
                </span>

                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value)
                  }
                  className="language-select"
                >
                  <option value="javascript">
                    JavaScript
                  </option>

                  <option value="python">
                    Python
                  </option>

                  <option value="typescript">
                    TypeScript
                  </option>

                  <option value="java">
                    Java
                  </option>

                  <option value="cpp">
                    C++
                  </option>
                </select>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              placeholder={`// Paste your ${language} code here...`}
              spellCheck="false"
            />

            <button
              className="debug-button"
              onClick={debugCode}
              disabled={isDebugging}
            >
              {isDebugging
                ? '⏳ Analyzing...'
                : '🔍 Debug Code'}
            </button>

          </div>


          {/* RIGHT PANEL */}
          <div className="panel">

            <div className="panel-header">
              <span className="panel-title">
                AI Analysis
              </span>
            </div>


            {/* EMPTY STATE */}
            {!result && !isDebugging && (
              <div className="empty-state">

                <div className="empty-icon">
                  ✦
                </div>

                <h2>
                  Your code is waiting.
                </h2>

                <p>
                  Paste some code on the left and let CodeDoctor
                  find what's wrong.
                </p>

              </div>
            )}


            {/* LOADING STATE */}
            {isDebugging && (
              <div className="empty-state">

                <div className="empty-icon">
                  ✦
                </div>

                <h2>
                  Analyzing your code...
                </h2>

                <p>
                  CodeDoctor is looking for bugs and understanding
                  what your code is trying to do.
                </p>

              </div>
            )}


            {/* RESULT */}
            {result && (
              <div className="analysis">

                {/* PROBLEM */}
                <div className="analysis-section">

                  <span className="analysis-label">
                    🐛 WHAT'S WRONG
                  </span>

                  <h2>
                    {result.problem}
                  </h2>

                </div>


                {/* EXPLANATION */}
                <div className="analysis-section">

                  <span className="analysis-label">
                    💡 WHY
                  </span>

                  <p>
                    {result.explanation}
                  </p>

                </div>


                {/* FIXED CODE */}
                <div className="analysis-section">

                  <span className="analysis-label">
                    🔧 FIXED CODE
                  </span>

                  <pre className="fixed-code">
                    <code>
                      {result.fixedCode}
                    </code>
                  </pre>

                </div>


                {/* CONCEPT */}
                <div className="analysis-section">

                  <span className="analysis-label">
                    🧠 CONCEPT
                  </span>

                  <p>
                    {result.concept}
                  </p>

                </div>


                {/* LEARNING TIP */}
                <div className="analysis-section">

                  <span className="analysis-label">
                    📚 LEARNING TIP
                  </span>

                  <p>
                    {result.learningTip}
                  </p>

                </div>

              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;