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
  'http://127.0.0.1:8000/debug',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            language: language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze code');
      }

      const data = await response.json();
      const analysis = data.analysis;

      const problem = analysis
        .split('EXPLANATION:')[0]
        .replace('PROBLEM:', '')
        .trim();

      const explanation = analysis
        .split('EXPLANATION:')[1]
        ?.split('FIXED_CODE:')[0]
        .trim();

      const fixedCode = analysis
        .split('FIXED_CODE:')[1]
        ?.split('CONCEPT:')[0]
        .replace(/```[a-zA-Z0-9+#.-]*\n?/g, '')
        .replace(/```/g, '')
        .trim();

      const concept = analysis
        .split('CONCEPT:')[1]
        ?.split('LEARNING_TIP:')[0]
        .trim();

      const learningTip = analysis
        .split('LEARNING_TIP:')[1]
        ?.trim();

      setResult({
        problem,
        explanation,
        fixedCode,
        concept,
        learningTip,
      });
    } catch (error) {
      console.error(error);

      setResult({
        problem: 'Something went wrong.',
        explanation:
          'CodeDoctor could not connect to the AI backend. Make sure your FastAPI server is running.',
        fixedCode: '',
        concept: 'Connection Error',
        learningTip: 'Check the backend terminal and try again.',
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
          <p className="eyebrow">AI DEVELOPER ASSISTANT</p>

          <h1>
            Don't just fix your code.
            <span> Understand it.</span>
          </h1>

          <p className="subtitle">
            Paste your code, find the bug, and learn why it happened.
          </p>
        </section>

        <section className="workspace">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-title">Your Code</span>

                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="language-select"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={`// Paste your ${language} code here...`}
              spellCheck="false"
            />

            <button
              className="debug-button"
              onClick={debugCode}
              disabled={isDebugging}
            >
              {isDebugging ? '⏳ Analyzing...' : '🔍 Debug Code'}
            </button>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">AI Analysis</span>
            </div>

            {!result && !isDebugging && (
              <div className="empty-state">
                <div className="empty-icon">✦</div>

                <h2>Your code is waiting.</h2>

                <p>
                  Paste some code on the left and let CodeDoctor
                  find what's wrong.
                </p>
              </div>
            )}

            {isDebugging && (
              <div className="empty-state">
                <div className="empty-icon">✦</div>

                <h2>Analyzing your code...</h2>

                <p>
                  CodeDoctor is looking for bugs and understanding
                  what your code is trying to do.
                </p>
              </div>
            )}

            {result && (
              <div className="analysis">
                <div className="analysis-section">
                  <span className="analysis-label">🐛 WHAT'S WRONG</span>
                  <h2>{result.problem}</h2>
                </div>

                <div className="analysis-section">
                  <span className="analysis-label">💡 WHY</span>
                  <p>{result.explanation}</p>
                </div>

                <div className="analysis-section">
                  <span className="analysis-label">🔧 FIXED CODE</span>

                  <pre className="fixed-code">
                    <code>{result.fixedCode}</code>
                  </pre>
                </div>

                <div className="analysis-section">
                  <span className="analysis-label">🧠 CONCEPT</span>
                  <p>{result.concept}</p>
                </div>

                <div className="analysis-section">
                  <span className="analysis-label">📚 LEARNING TIP</span>
                  <p>{result.learningTip}</p>
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