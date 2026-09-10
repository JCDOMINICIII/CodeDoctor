import { useState } from 'react';
import './index.css';

const BACKEND_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8000'
  : 'https://codedoctor-backend-docker.onrender.com';

  
function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isDebugging, setIsDebugging] = useState(false);
  const [result, setResult] = useState(null);
  const [showFix, setShowFix] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ==========================================
  // LEARNING MODE
  // ==========================================

  const [learningAnswer, setLearningAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [hasAttemptedAnswer, setHasAttemptedAnswer] = useState(false);

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem(
      'codedoctor-history'
    );

    return savedHistory
      ? JSON.parse(savedHistory)
      : [];
  });

  const [explanationLevel, setExplanationLevel] = useState(() => {
    return (
      localStorage.getItem(
        'codedoctor-explanation-level'
      ) || 'detailed'
    );
  });

  const [debuggingMode, setDebuggingMode] = useState(() => {
    return (
      localStorage.getItem(
        'codedoctor-debugging-mode'
      ) || 'tutor'
    );
  });

  // ==========================================
  // DEBUG CODE
  // ==========================================

  const debugCode = async () => {
    if (!code.trim()) {
      return;
    }

    setIsDebugging(true);
    setResult(null);
    setShowFix(false);

    setLearningAnswer('');
    setAnswerFeedback(null);
    setHasAttemptedAnswer(false);
    setIsEvaluatingAnswer(false);

    try {
      const response = await fetch(
        `${BACKEND_URL}/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            language: language,
            explanationLevel: explanationLevel,

            runtimeOutput:
              runResult?.output || '',

            runtimeError:
              runResult?.error || '',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Something went wrong.'
        );
      }

      const newHistoryItem = {
        id: Date.now(),
        code: code,
        language: language,
        debuggingMode: debuggingMode,
        problem: data.problem,
        explanation: data.explanation,
        fixedCode: data.fixed_code,
        concept: data.concept,
        learningTip: data.learning_tip,
        hint: data.hint,
        question: data.question,
        createdAt: new Date().toLocaleString(),
      };

      const updatedHistory = [
        newHistoryItem,
        ...history,
      ];

      setHistory(updatedHistory);

      localStorage.setItem(
        'codedoctor-history',
        JSON.stringify(updatedHistory)
      );

      setResult({
        problem: data.problem,
        explanation: data.explanation,
        fixedCode: data.fixed_code,
        concept: data.concept,
        learningTip: data.learning_tip,
        hint: data.hint,
        question: data.question,
      });

    } catch (error) {
      console.error('Debug error:', error);

      setResult({
        problem: 'Unable to analyze your code.',
        explanation:
          error.message ||
          'Something went wrong while connecting to CodeDoctor.',
        fixedCode: '',
        concept: 'Connection',
        learningTip:
          'Make sure the CodeDoctor backend is available.',
        hint:
          'Check your internet connection and try again.',
        question:
          'Can you identify whether the problem is in your code or in the connection to the backend?',
      });

    } finally {
      setIsDebugging(false);
    }
  };

  // ==========================================
  // RUN CODE
  // ==========================================

  const runCode = async () => {
    if (!code.trim()) {
      return;
    }

    setIsRunning(true);
    setRunResult(null);
    setResult(null);

    setLearningAnswer('');
    setAnswerFeedback(null);
    setHasAttemptedAnswer(false);
    setIsEvaluatingAnswer(false);

    try {
      const response = await fetch(
        `${BACKEND_URL}/run`,
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Something went wrong.'
        );
      }

      setRunResult(data);

    } catch (error) {
      console.error('Run error:', error);

      setRunResult({
        success: false,
        output: '',
        error:
          error.message ||
          'Something went wrong while running your code.',
      });

    } finally {
      setIsRunning(false);
    }
  };

  // ==========================================
  // LEARNING MODE
  // ==========================================

  const checkLearningAnswer = async () => {
    if (!learningAnswer.trim() || !result) {
      return;
    }

    setHasAttemptedAnswer(true);
    setIsEvaluatingAnswer(true);
    setAnswerFeedback(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/evaluate-answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            language: language,
            problem: result.problem,
            explanation: result.explanation,
            learningAnswer: learningAnswer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          'Something went wrong while evaluating your answer.'
        );
      }

      setAnswerFeedback({
        result: data.result,
        feedback: data.feedback,
        hint: data.hint,
        question: data.question,
      });

    } catch (error) {
      console.error(
        'Answer evaluation error:',
        error
      );

      setAnswerFeedback({
        result: 'ERROR',
        feedback:
          error.message ||
          'CodeDoctor could not evaluate your answer right now.',
        hint:
          'Try checking your reasoning against the problem CodeDoctor identified.',
        question:
          'What part of the code do you think is responsible for the problem?',
      });

    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  // ==========================================
  // HISTORY
  // ==========================================

  const deleteHistoryItem = (id) => {
    const updatedHistory = history.filter(
      (item) => item.id !== id
    );

    setHistory(updatedHistory);

    localStorage.setItem(
      'codedoctor-history',
      JSON.stringify(updatedHistory)
    );
  };

  const clearHistory = () => {
    setHistory([]);

    localStorage.removeItem(
      'codedoctor-history'
    );
  };

  const changeExplanationLevel = (level) => {
    setExplanationLevel(level);

    localStorage.setItem(
      'codedoctor-explanation-level',
      level
    );
  };

  const changeDebuggingMode = (mode) => {
    setDebuggingMode(mode);

    localStorage.setItem(
      'codedoctor-debugging-mode',
      mode
    );

    setShowFix(false);
    setLearningAnswer('');
    setAnswerFeedback(null);
    setHasAttemptedAnswer(false);
    setIsEvaluatingAnswer(false);
  };

  const loadHistorySession = (item) => {
    setCode(item.code);
    setLanguage(item.language);

    setResult({
      problem: item.problem,
      explanation: item.explanation,
      fixedCode: item.fixedCode,
      concept: item.concept,
      learningTip: item.learningTip,
      hint: item.hint,
      question: item.question,
    });

    setRunResult(null);
    setShowFix(false);
    setLearningAnswer('');
    setAnswerFeedback(null);
    setHasAttemptedAnswer(false);
    setIsEvaluatingAnswer(false);
    setShowHistory(false);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="app">

      <nav className="navbar">

        <div className="logo">
          <span className="logo-icon">🩺</span>
          <span>CodeDoctor</span>
        </div>

        <div className="nav-right">

          <button
            className="nav-button"
            onClick={() => setShowHistory(true)}
          >
            History
          </button>

          <button
            className="nav-button"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </button>

        </div>

      </nav>

      <main className="main-content">

        <section className="hero">

          <p className="eyebrow">
            AI DEVELOPER ASSISTANT
          </p>

          <h1>
            Don't just fix your code.
            <br />
            <span>Understand it.</span>
          </h1>

          <p className="subtitle">
            Paste your code, find the bug, and learn why it happened.
          </p>

        </section>

        <section className="workspace">

          <div className="panel">

            <div className="panel-header">

              <div>
                <span className="panel-title">
                  Your Code
                </span>

                <span className="panel-language">
                  {language}
                </span>
              </div>

              <select
                className="language-select"
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  setRunResult(null);
                  setResult(null);
                  setLearningAnswer('');
                  setAnswerFeedback(null);
                  setHasAttemptedAnswer(false);
                  setIsEvaluatingAnswer(false);
                }}
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

                <option value="c++">
                  C++
                </option>

              </select>

            </div>

            <textarea
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setRunResult(null);
                setResult(null);
                setLearningAnswer('');
                setAnswerFeedback(null);
                setHasAttemptedAnswer(false);
                setIsEvaluatingAnswer(false);
              }}
              placeholder="Paste your code here..."
              spellCheck="false"
            />

            <div className="code-actions">

              <button
                className="run-button"
                onClick={runCode}
                disabled={isRunning || isDebugging}
              >
                {isRunning
                  ? 'Running...'
                  : '▶ Run Code'}
              </button>

              <button
                className="debug-button"
                onClick={debugCode}
                disabled={isDebugging || isRunning}
              >
                {isDebugging
                  ? 'Analyzing...'
                  : 'Debug Code'}
              </button>

            </div>

          </div>

          <div className="panel">

            <div className="panel-header">

              <span className="panel-title">
                AI Analysis
              </span>

            </div>

            {!result &&
              !runResult &&
              !isDebugging &&
              !isRunning && (

              <div className="empty-state">

                <div className="empty-icon">
                  🩺
                </div>

                <h2>
                  Ready to diagnose.
                </h2>

                <p>
                  Your code analysis will appear here.
                  CodeDoctor will find the problem,
                  explain it, and help you understand
                  the fix.
                </p>

              </div>

            )}

            {isRunning && (

              <div className="empty-state">

                <div className="empty-icon">
                  ▶
                </div>

                <h2>
                  Running your code...
                </h2>

                <p>
                  CodeDoctor is executing your {language} code and checking the result.
                </p>

              </div>

            )}

            {runResult && !isRunning && (

              <div className="analysis">

                <div className="analysis-section">

                  <span className="analysis-label">
                    {runResult.success
                      ? '✅ OUTPUT'
                      : '❌ RUNTIME ERROR'}
                  </span>

                  {runResult.success ? (

                    <pre className="fixed-code">
                      <code>
                        {runResult.output || 'No output.'}
                      </code>
                    </pre>

                  ) : (

                    <pre className="fixed-code">
                      <code>
                        {runResult.error}
                      </code>
                    </pre>

                  )}

                </div>

                {runResult.success && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🟢 EXECUTION STATUS
                    </span>

                    <p>
                      Your code ran successfully.
                    </p>

                  </div>

                )}

                {!runResult.success && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🩺 NEXT STEP
                    </span>

                    <p>
                      CodeDoctor found a runtime error.
                      Click Debug Code to let the AI
                      explain what caused it and how
                      to fix it.
                    </p>

                  </div>

                )}

              </div>

            )}

            {isDebugging && (

              <div className="empty-state">

                <div className="empty-icon">
                  ⏳
                </div>

                <h2>
                  Analyzing your code...
                </h2>

                <p>
                  CodeDoctor is looking for the bug
                  and figuring out why it happened.
                </p>

              </div>

            )}

            {result && !isDebugging && !isRunning && (

              <div className="analysis">

                <div className="analysis-section">

                  <span className="analysis-label">
                    🚨 WHAT'S WRONG
                  </span>

                  <h2>
                    {result.problem}
                  </h2>

                </div>

                {debuggingMode === 'tutor' && (
                  <>

                    <div className="analysis-section tutor-question">

                      <span className="analysis-label">
                        🧠 THINK ABOUT IT
                      </span>

                      <p>
                        {result.question}
                      </p>

                    </div>

                    <div className="analysis-section tutor-hint">

                      <span className="analysis-label">
                        💡 HINT
                      </span>

                      <p>
                        {result.hint}
                      </p>

                    </div>

                    <div className="analysis-section your-turn">

                      <span className="analysis-label">
                        ✍️ YOUR TURN
                      </span>

                      <p>
                        Before revealing the fix, explain what
                        you think is causing the problem.
                      </p>

                      <textarea
                        className="learning-answer"
                        value={learningAnswer}
                        onChange={(event) => {
                          setLearningAnswer(event.target.value);
                          setAnswerFeedback(null);
                          setHasAttemptedAnswer(false);
                        }}
                        placeholder="What do you think is causing the problem?"
                        rows="4"
                      />

                      <button
                        className="check-answer-button"
                        onClick={checkLearningAnswer}
                        disabled={
                          !learningAnswer.trim() ||
                          isEvaluatingAnswer
                        }
                      >
                        {isEvaluatingAnswer
                          ? '🧠 Evaluating...'
                          : '✅ Check My Answer'}
                      </button>

                      {hasAttemptedAnswer &&
                        answerFeedback && (

                        <div className="answer-feedback">

                          <span className="analysis-label">
                            {answerFeedback.result === 'CORRECT'
                              ? '✅ CORRECT'
                              : answerFeedback.result === 'PARTIALLY_CORRECT'
                                ? '🟡 PARTIALLY CORRECT'
                                : answerFeedback.result === 'INCORRECT'
                                  ? '❌ NOT QUITE'
                                  : '🩺 CODEDOCTOR FEEDBACK'}
                          </span>

                          <p>
                            {answerFeedback.feedback}
                          </p>

                          <div className="answer-feedback-hint">

                            <span className="analysis-label">
                              💡 NEXT HINT
                            </span>

                            <p>
                              {answerFeedback.hint}
                            </p>

                          </div>

                          <div className="answer-feedback-question">

                            <span className="analysis-label">
                              🤔 THINK ABOUT THIS
                            </span>

                            <p>
                              {answerFeedback.question}
                            </p>

                          </div>

                        </div>

                      )}

                    </div>

                  </>
                )}

                <div className="analysis-section">

                  <span className="analysis-label">
                    🔧 FIXED CODE
                  </span>

                  {debuggingMode === 'debug' ? (

                    <pre className="fixed-code">
                      <code>
                        {result.fixedCode}
                      </code>
                    </pre>

                  ) : (

                    !showFix ? (

                      <div className="reveal-fix-container">

                        <p>
                          Think you've found the problem?
                          Reveal the solution when you're ready.
                        </p>

                        <button
                          className="reveal-fix-button"
                          onClick={() => setShowFix(true)}
                        >
                          🔓 Reveal Fix
                        </button>

                      </div>

                    ) : (

                      <div>

                        <pre className="fixed-code">
                          <code>
                            {result.fixedCode}
                          </code>
                        </pre>

                        <button
                          className="hide-fix-button"
                          onClick={() => setShowFix(false)}
                        >
                          Hide Fix
                        </button>

                      </div>

                    )

                  )}

                </div>

                <div className="analysis-section">

                  <span className="analysis-label">
                    📖 WHY
                  </span>

                  <p>
                    {result.explanation}
                  </p>

                </div>

                <div className="analysis-section">

                  <span className="analysis-label">
                    🧠 CONCEPT
                  </span>

                  <p>
                    {result.concept}
                  </p>

                </div>

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

      {/* ==========================================
          HISTORY MODAL
          ========================================== */}

      {showHistory && (

        <div
          className="history-overlay"
          onClick={() => setShowHistory(false)}
        >

          <div
            className="history-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="history-header">

              <div>
                <h2>
                  Debug History
                </h2>

                <p>
                  Review your previous CodeDoctor sessions.
                </p>
              </div>

              <div className="history-header-actions">

                {history.length > 0 && (

                  <button
                    className="clear-history-button"
                    onClick={clearHistory}
                  >
                    Clear All
                  </button>

                )}

                <button
                  className="close-history-button"
                  onClick={() => setShowHistory(false)}
                >
                  ✕
                </button>

              </div>

            </div>

            {history.length === 0 ? (

              <div className="history-empty">

                <div className="history-empty-icon">
                  🕘
                </div>

                <h3>
                  No debugging history yet.
                </h3>

                <p>
                  Your analyzed code will appear here
                  so you can come back to it later.
                </p>

              </div>

            ) : (

              <div className="history-list">

                {history.map((item) => (

                  <div
                    className="history-card"
                    key={item.id}
                  >

                    <div className="history-card-top">

                      <span className="history-language">
                        {item.language}
                      </span>

                      <span className="history-date">
                        {item.createdAt}
                      </span>

                    </div>

                    <h3 className="history-problem">
                      {item.problem}
                    </h3>

                    <p className="history-explanation">
                      {item.explanation}
                    </p>

                    <div className="history-actions">

                      <button
                        className="load-session-button"
                        onClick={() =>
                          loadHistorySession(item)
                        }
                      >
                        Load Session
                      </button>

                      <button
                        className="delete-history-button"
                        onClick={() =>
                          deleteHistoryItem(item.id)
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      )}

      {/* ==========================================
          SETTINGS MODAL
          ========================================== */}

      {showSettings && (

        <div
          className="settings-overlay"
          onClick={() => setShowSettings(false)}
        >

          <div
            className="settings-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="settings-header">

              <div>
                <h2>
                  Settings
                </h2>

                <p>
                  Customize how CodeDoctor helps you learn.
                </p>
              </div>

              <button
                className="close-settings-button"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>

            </div>

            <div className="settings-content">

              <div className="setting-item">

                <div className="setting-info">

                  <h3>
                    Explanation Level
                  </h3>

                  <p>
                    Choose how detailed CodeDoctor's
                    explanations should be.
                  </p>

                </div>

                <select
                  className="settings-select"
                  value={explanationLevel}
                  onChange={(event) =>
                    changeExplanationLevel(
                      event.target.value
                    )
                  }
                >

                  <option value="simple">
                    Simple
                  </option>

                  <option value="detailed">
                    Detailed
                  </option>

                  <option value="expert">
                    Expert
                  </option>

                </select>

              </div>

              <div className="setting-item">

                <div className="setting-info">

                  <h3>
                    Debugging Mode
                  </h3>

                  <p>
                    Choose between learning with guidance
                    or getting straight to the solution.
                  </p>

                </div>

                <select
                  className="settings-select"
                  value={debuggingMode}
                  onChange={(event) =>
                    changeDebuggingMode(
                      event.target.value
                    )
                  }
                >

                  <option value="tutor">
                    Tutor Mode
                  </option>

                  <option value="debug">
                    Debug Mode
                  </option>

                </select>

              </div>

              <div className="setting-item">

                <div className="setting-info">

                  <h3>
                    Debug History
                  </h3>

                  <p>
                    Delete all saved debugging sessions
                    from this device.
                  </p>

                </div>

                <button
                  className="settings-danger-button"
                  onClick={clearHistory}
                  disabled={history.length === 0}
                >
                  Clear History
                </button>

              </div>

              <div className="setting-item settings-about">

                <div className="setting-info">

                  <h3>
                    About CodeDoctor
                  </h3>

                  <p>
                    An AI-powered coding debugger and
                    learning assistant designed to help
                    developers understand their mistakes.
                  </p>

                </div>

                <span className="settings-version">
                  v2.0.0
                </span>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;