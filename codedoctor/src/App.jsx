import { useEffect, useState } from 'react';
import './index.css';

const BACKEND_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8000'
  : 'https://codedoctor-backend-docker.onrender.com';

// ==========================================
// CONCEPT NORMALIZATION
// ==========================================

const normalizeConcept = (concept) => {
  if (!concept) {
    return 'Unknown';
  }

  const normalized = concept.trim().toLowerCase();

  const exactConcepts = {
    variables: 'Variables',
    'data types': 'Data Types',
    operators: 'Operators',
    conditionals: 'Conditionals',
    functions: 'Functions',
    arrays: 'Arrays',
    lists: 'Lists',
    dictionaries: 'Dictionaries',
    tuples: 'Tuples',
    sets: 'Sets',
    objects: 'Objects',
    loops: 'Loops',
    dom: 'DOM',
    events: 'Events',
    'async javascript': 'Async JavaScript',
    'error handling': 'Error Handling',
    'es6+': 'ES6+',
    modules: 'Modules',
    'async python': 'Async Python',
    types: 'Types',
    interfaces: 'Interfaces',
    generics: 'Generics',
    methods: 'Methods',
    collections: 'Collections',
    classes: 'Classes',
    inheritance: 'Inheritance',
    exceptions: 'Exceptions',
    pointers: 'Pointers',
    references: 'References',
    templates: 'Templates',
    memory: 'Memory',
    narrowing: 'Narrowing',
    'async typescript': 'Async TypeScript',
    oop: 'OOP',
  };

  if (exactConcepts[normalized]) {
    return exactConcepts[normalized];
  }

  // Operators
  if (
    normalized.includes('operator') ||
    normalized.includes('assignment') ||
    normalized.includes('comparison') ||
    normalized.includes('equality') ||
    normalized.includes('arithmetic') ||
    normalized.includes('logical operator')
  ) {
    return 'Operators';
  }

  // Variables
  if (
    normalized.includes('variable') ||
    normalized === 'const' ||
    normalized === 'let' ||
    normalized === 'var' ||
    normalized.includes('constant')
  ) {
    return 'Variables';
  }

  // Functions
  if (
    normalized.includes('function') ||
    normalized.includes('parameter') ||
    normalized.includes('argument') ||
    normalized.includes('return value')
  ) {
    return 'Functions';
  }

  // Arrays
  if (normalized.includes('array')) {
    return 'Arrays';
  }

  // Lists
  if (normalized.includes('list')) {
    return 'Lists';
  }

  // Dictionaries
  if (normalized.includes('dictionary')) {
    return 'Dictionaries';
  }

  // Objects
  if (
    normalized.includes('object') ||
    normalized.includes('property')
  ) {
    return 'Objects';
  }

  // Loops
  if (
    normalized.includes('loop') ||
    normalized.includes('iteration')
  ) {
    return 'Loops';
  }

  // Conditionals
  if (
    normalized.includes('conditional') ||
    normalized.includes('if statement') ||
    normalized.includes('if/else') ||
    normalized.includes('branching')
  ) {
    return 'Conditionals';
  }

  // DOM
  if (
    normalized.includes('dom') ||
    normalized.includes('document object model') ||
    normalized.includes('html element')
  ) {
    return 'DOM';
  }

  // Events
  if (
    normalized.includes('event') ||
    normalized.includes('event listener')
  ) {
    return 'Events';
  }

  // Error Handling
  if (
    normalized.includes('error handling') ||
    normalized.includes('exception') ||
    normalized.includes('try/catch') ||
    normalized.includes('try catch')
  ) {
    return 'Error Handling';
  }

  // Data Types
  if (
    normalized.includes('data type') ||
    normalized.includes('datatype')
  ) {
    return 'Data Types';
  }

  // Classes / OOP
  if (
    normalized.includes('class') ||
    normalized.includes('oop') ||
    normalized.includes('object-oriented')
  ) {
    return 'OOP';
  }

  return concept.trim();
};

function App() {
  // ==========================================
  // CORE STATE
  // ==========================================

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const [isDebugging, setIsDebugging] = useState(false);
  const [result, setResult] = useState(null);
  const [showFix, setShowFix] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  // ==========================================
  // MODALS
  // ==========================================

  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ==========================================
  // CURRENT HISTORY SESSION
  // ==========================================

  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  // ==========================================
  // LEARNING MODE
  // ==========================================

  const [learningAnswer, setLearningAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [hasAttemptedAnswer, setHasAttemptedAnswer] = useState(false);

  // ==========================================
  // HISTORY
  // ==========================================

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem(
      'codedoctor-history'
    );

    if (!savedHistory) {
      return [];
    }

    try {
      const parsedHistory = JSON.parse(savedHistory);

      return parsedHistory.map((item) => ({
        ...item,
        concept: normalizeConcept(item.concept),
      }));
    } catch (error) {
      console.error(
        'Failed to load CodeDoctor history:',
        error
      );

      return [];
    }
  });

  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  // ==========================================
  // SETTINGS
  // ==========================================

  const [explanationLevel, setExplanationLevel] =
    useState(() => {
      return (
        localStorage.getItem(
          'codedoctor-explanation-level'
        ) || 'detailed'
      );
    });

  const [debuggingMode, setDebuggingMode] =
    useState(() => {
      return (
        localStorage.getItem(
          'codedoctor-debugging-mode'
        ) || 'tutor'
      );
    });

  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem(
        'codedoctor-theme'
      ) || 'dark'
    );
  });

  // ==========================================
  // THEME
  // ==========================================

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    localStorage.setItem(
      'codedoctor-theme',
      theme
    );
  }, [theme]);

  // ==========================================
  // HISTORY MIGRATION
  // ==========================================

  useEffect(() => {
    const savedHistory = localStorage.getItem(
      'codedoctor-history'
    );

    if (!savedHistory) {
      return;
    }

    try {
      const parsedHistory = JSON.parse(
        savedHistory
      );

      const normalizedHistory =
        parsedHistory.map((item) => ({
          ...item,
          concept: normalizeConcept(
            item.concept
          ),
        }));

      if (
        JSON.stringify(parsedHistory) !==
        JSON.stringify(normalizedHistory)
      ) {
        localStorage.setItem(
          'codedoctor-history',
          JSON.stringify(normalizedHistory)
        );
      }
    } catch (error) {
      console.error(
        'Failed to migrate CodeDoctor history:',
        error
      );
    }
  }, []);

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
    setCurrentHistoryId(null);

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
            code,
            language,
            explanationLevel,
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
          data.detail ||
            'Something went wrong.'
        );
      }

      const normalizedConcept =
        normalizeConcept(data.concept);

      const newHistoryItem = {
        id: Date.now(),
        code,
        language,
        debuggingMode,
        problem: data.problem,
        explanation: data.explanation,
        fixedCode: data.fixed_code,
        concept: normalizedConcept,
        learningTip: data.learning_tip,
        hint: data.hint,
        question: data.question,
        createdAt:
          new Date().toLocaleString(),

        answerResult: null,
        answerFeedback: null,
      };

      const updatedHistory = [
        newHistoryItem,
        ...history,
      ];

      setHistory(updatedHistory);
      setCurrentHistoryId(
        newHistoryItem.id
      );

      localStorage.setItem(
        'codedoctor-history',
        JSON.stringify(updatedHistory)
      );

      setResult({
        problem: data.problem,
        explanation: data.explanation,
        fixedCode: data.fixed_code,
        concept: normalizedConcept,
        learningTip: data.learning_tip,
        hint: data.hint,
        question: data.question,
      });
    } catch (error) {
      console.error(
        'Debug error:',
        error
      );

      setResult({
        problem:
          'Unable to analyze your code.',
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
    setCurrentHistoryId(null);

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
            code,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Something went wrong.'
        );
      }

      setRunResult(data);
    } catch (error) {
      console.error(
        'Run error:',
        error
      );

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
    if (
      !learningAnswer.trim() ||
      !result
    ) {
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
            code,
            language,
            problem: result.problem,
            explanation:
              result.explanation,
            learningAnswer,
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

      const updatedHistory =
        history.map((item) => {
          if (
            item.id ===
            currentHistoryId
          ) {
            return {
              ...item,
              answerResult:
                data.result,
              answerFeedback:
                data.feedback,
            };
          }

          return item;
        });

      setHistory(updatedHistory);

      localStorage.setItem(
        'codedoctor-history',
        JSON.stringify(updatedHistory)
      );
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
    const updatedHistory =
      history.filter(
        (item) => item.id !== id
      );

    setHistory(updatedHistory);

    if (id === currentHistoryId) {
      setCurrentHistoryId(null);
    }

    localStorage.setItem(
      'codedoctor-history',
      JSON.stringify(updatedHistory)
    );
  };

  const clearHistory = () => {
    setHistory([]);
    setCurrentHistoryId(null);

    localStorage.removeItem(
      'codedoctor-history'
    );
  };

  const loadHistorySession = (item) => {
    setCurrentHistoryId(item.id);

    setCode(item.code);
    setLanguage(item.language);

    setResult({
      problem: item.problem,
      explanation: item.explanation,
      fixedCode: item.fixedCode,
      concept: normalizeConcept(
        item.concept
      ),
      learningTip: item.learningTip,
      hint: item.hint,
      question: item.question,
    });

    setRunResult(null);
    setShowFix(false);

    setLearningAnswer('');
    setHasAttemptedAnswer(false);
    setIsEvaluatingAnswer(false);

    if (item.answerResult) {
      setAnswerFeedback({
        result: item.answerResult,
        feedback:
          item.answerFeedback ||
          'You previously checked your answer for this session.',
        hint: '',
        question: '',
      });
    } else {
      setAnswerFeedback(null);
    }

    setShowHistory(false);
    setHistorySearch('');
    setHistoryFilter('all');
  };

  // ==========================================
  // HISTORY SEARCH + FILTER
  // ==========================================

  const filteredHistory =
    history.filter((item) => {
      const search =
        historySearch
          .toLowerCase()
          .trim();

      const problem =
        item.problem || '';

      const explanation =
        item.explanation || '';

      const concept =
        normalizeConcept(
          item.concept
        );

      const itemCode =
        item.code || '';

      const matchesSearch =
        !search ||
        problem
          .toLowerCase()
          .includes(search) ||
        explanation
          .toLowerCase()
          .includes(search) ||
        concept
          .toLowerCase()
          .includes(search) ||
        itemCode
          .toLowerCase()
          .includes(search);

      const matchesLanguage =
        historyFilter === 'all' ||
        item.language ===
          historyFilter;

      return (
        matchesSearch &&
        matchesLanguage
      );
    });

  const historyLanguages = [
    ...new Set(
      history.map(
        (item) => item.language
      )
    ),
  ].sort();

  // ==========================================
  // PROGRESS DATA
  // ==========================================

  const languageCounts =
    history.reduce(
      (counts, item) => {
        counts[item.language] =
          (counts[item.language] ||
            0) + 1;

        return counts;
      },
      {}
    );

  const conceptCounts =
    history.reduce(
      (counts, item) => {
        const concept =
          normalizeConcept(
            item.concept
          );

        counts[concept] =
          (counts[concept] ||
            0) + 1;

        return counts;
      },
      {}
    );

  const sortedLanguages =
    Object.entries(
      languageCounts
    ).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(
        b[0]
      );
    });

  const sortedConcepts =
    Object.entries(
      conceptCounts
    ).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(
        b[0]
      );
    });

  // ==========================================
  // LEARNING PERFORMANCE
  // ==========================================

  const totalAnswerAttempts =
    history.filter(
      (item) =>
        item.answerResult &&
        item.answerResult !==
          'ERROR'
    ).length;

  const correctAnswers =
    history.filter(
      (item) =>
        item.answerResult ===
        'CORRECT'
    ).length;

  const partialAnswers =
    history.filter(
      (item) =>
        item.answerResult ===
        'PARTIALLY_CORRECT'
    ).length;

  const incorrectAnswers =
    history.filter(
      (item) =>
        item.answerResult ===
        'INCORRECT'
    ).length;

  const answerAccuracy =
    totalAnswerAttempts > 0
      ? Math.round(
          (correctAnswers /
            totalAnswerAttempts) *
            100
        )
      : 0;

  const learningScore =
    totalAnswerAttempts > 0
      ? Math.round(
          (
            correctAnswers * 100 +
            partialAnswers * 50
          ) /
            totalAnswerAttempts
        )
      : 0;

  // ==========================================
  // CONCEPT PERFORMANCE
  // ==========================================

  const conceptPerformanceMap =
    history.reduce(
      (scores, item) => {
        if (
          !item.answerResult ||
          item.answerResult ===
            'ERROR'
        ) {
          return scores;
        }

        const concept =
          normalizeConcept(
            item.concept
          );

        if (!scores[concept]) {
          scores[concept] = {
            attempts: 0,
            score: 0,
          };
        }

        scores[concept].attempts +=
          1;

        if (
          item.answerResult ===
          'CORRECT'
        ) {
          scores[concept].score +=
            100;
        }

        if (
          item.answerResult ===
          'PARTIALLY_CORRECT'
        ) {
          scores[concept].score +=
            50;
        }

        return scores;
      },
      {}
    );

  const conceptPerformance =
    Object.entries(
      conceptPerformanceMap
    ).map(
      ([concept, data]) => ({
        concept,
        attempts: data.attempts,
        percentage: Math.round(
          data.score /
            data.attempts
        ),
      })
    );

  /*
    When possible, strongest/weakest
    concepts are calculated using
    concepts with at least two attempts.

    This prevents a single lucky
    answer from dominating the
    progress dashboard.
  */

  const qualifiedConcepts =
    conceptPerformance.filter(
      (item) =>
        item.attempts >= 2
    );

  const performancePool =
    qualifiedConcepts.length > 0
      ? qualifiedConcepts
      : conceptPerformance;

  const strongestConcept =
    performancePool.length > 0
      ? [...performancePool].sort(
          (a, b) => {
            if (
              b.percentage !==
              a.percentage
            ) {
              return (
                b.percentage -
                a.percentage
              );
            }

            if (
              b.attempts !==
              a.attempts
            ) {
              return (
                b.attempts -
                a.attempts
              );
            }

            return a.concept.localeCompare(
              b.concept
            );
          }
        )[0]
      : null;

  const weakestConcept =
    performancePool.length > 0
      ? [...performancePool].sort(
          (a, b) => {
            if (
              a.percentage !==
              b.percentage
            ) {
              return (
                a.percentage -
                b.percentage
              );
            }

            if (
              b.attempts !==
              a.attempts
            ) {
              return (
                b.attempts -
                a.attempts
              );
            }

            return a.concept.localeCompare(
              b.concept
            );
          }
        )[0]
      : null;

  const strongestLanguage =
    sortedLanguages.length > 0
      ? sortedLanguages[0][0]
      : '—';

  const mostPracticedConcept =
    sortedConcepts.length > 0
      ? sortedConcepts[0][0]
      : '—';

  const strongestConceptScore =
    strongestConcept
      ? strongestConcept.percentage
      : 0;

  const weakestConceptScore =
    weakestConcept
      ? weakestConcept.percentage
      : 0;

  // ==========================================
  // SETTINGS
  // ==========================================

  const changeExplanationLevel = (
    level
  ) => {
    setExplanationLevel(level);

    localStorage.setItem(
      'codedoctor-explanation-level',
      level
    );
  };

  const changeDebuggingMode = (
    mode
  ) => {
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

  const changeTheme = (newTheme) => {
    setTheme(newTheme);

    localStorage.setItem(
      'codedoctor-theme',
      newTheme
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="app">

      {/* ========================================
          NAVBAR
      ======================================== */}

      <nav className="navbar">

        <div className="logo">

          <span className="logo-icon">
            🩺
          </span>

          <span>
            CodeDoctor
          </span>

        </div>

        <div className="nav-right">

          <button
            className="nav-button"
            onClick={() =>
              setShowProgress(true)
            }
          >
            Progress
          </button>

          <button
            className="nav-button"
            onClick={() =>
              setShowHistory(true)
            }
          >
            History
          </button>

          <button
            className="nav-button"
            onClick={() =>
              setShowSettings(true)
            }
          >
            Settings
          </button>

        </div>

      </nav>

      {/* ========================================
          MAIN
      ======================================== */}

      <main className="main-content">

        <section className="hero">

          <p className="eyebrow">
            AI DEVELOPER ASSISTANT
          </p>

          <h1>
            Don't just fix your code.
            <br />

            <span>
              Understand it.
            </span>
          </h1>

          <p className="subtitle">
            Paste your code, find the bug,
            and learn why it happened.
          </p>

        </section>

        {/* ======================================
            WORKSPACE
        ====================================== */}

        <section className="workspace">

          {/* ====================================
              CODE PANEL
          ==================================== */}

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

                  setLanguage(
                    event.target.value
                  );

                  setCurrentHistoryId(
                    null
                  );

                  setRunResult(null);
                  setResult(null);
                  setLearningAnswer(
                    ''
                  );
                  setAnswerFeedback(
                    null
                  );
                  setHasAttemptedAnswer(
                    false
                  );
                  setIsEvaluatingAnswer(
                    false
                  );

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

                setCode(
                  event.target.value
                );

                setCurrentHistoryId(
                  null
                );

                setRunResult(null);
                setResult(null);
                setLearningAnswer(
                  ''
                );
                setAnswerFeedback(
                  null
                );
                setHasAttemptedAnswer(
                  false
                );
                setIsEvaluatingAnswer(
                  false
                );

              }}
              placeholder="Paste your code here..."
              spellCheck="false"
            />

            <div className="code-actions">

              <button
                className="run-button"
                onClick={runCode}
                disabled={
                  isRunning ||
                  isDebugging
                }
              >
                {isRunning
                  ? 'Running...'
                  : '▶ Run Code'}
              </button>

              <button
                className="debug-button"
                onClick={debugCode}
                disabled={
                  isDebugging ||
                  isRunning
                }
              >
                {isDebugging
                  ? 'Analyzing...'
                  : 'Debug Code'}
              </button>

            </div>

          </div>

          {/* ====================================
              AI ANALYSIS PANEL
          ==================================== */}

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
                  Your code analysis will
                  appear here. CodeDoctor will
                  find the problem, explain it,
                  and help you understand the fix.
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
                  CodeDoctor is executing your{' '}
                  {language}{' '}
                  code and checking the result.
                </p>

              </div>

            )}

            {runResult &&
              !isRunning && (

              <div className="analysis">

                <div className="analysis-section">

                  <span className="analysis-label">
                    {runResult.success
                      ? '✅ OUTPUT'
                      : '❌ RUNTIME ERROR'}
                  </span>

                  <pre className="fixed-code">

                    <code>
                      {runResult.success
                        ? runResult.output ||
                          'No output.'
                        : runResult.error}
                    </code>

                  </pre>

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
                      CodeDoctor found a runtime
                      error. Click Debug Code to let
                      the AI explain what caused it
                      and how to fix it.
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
                  CodeDoctor is analyzing your{' '}
                  {language}{' '}
                  code and figuring out why
                  it happened.
                </p>

              </div>

            )}

            {result &&
              !isDebugging &&
              !isRunning && (

              <div className="analysis">

                {/* WHAT'S WRONG */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    🚨 WHAT'S WRONG
                  </span>

                  <h2>
                    {result.problem}
                  </h2>

                </div>

                {/* TUTOR MODE */}

                {debuggingMode ===
                  'tutor' && (

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
                        Before revealing the fix,
                        explain what you think is
                        causing the problem.
                      </p>

                      <textarea
                        className="learning-answer"
                        value={
                          learningAnswer
                        }
                        onChange={(
                          event
                        ) => {

                          setLearningAnswer(
                            event.target
                              .value
                          );

                          setAnswerFeedback(
                            null
                          );

                          setHasAttemptedAnswer(
                            false
                          );

                        }}
                        placeholder="What do you think is causing the problem?"
                        rows="4"
                      />

                      <button
                        className="check-answer-button"
                        onClick={
                          checkLearningAnswer
                        }
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

                            {answerFeedback.result ===
                            'CORRECT'
                              ? '✅ CORRECT'
                              : answerFeedback.result ===
                                'PARTIALLY_CORRECT'
                                ? '🟡 PARTIALLY CORRECT'
                                : answerFeedback.result ===
                                  'INCORRECT'
                                  ? '❌ NOT QUITE'
                                  : '🩺 CODEDOCTOR FEEDBACK'}

                          </span>

                          <p>
                            {
                              answerFeedback.feedback
                            }
                          </p>

                          {answerFeedback.hint && (

                            <div className="answer-feedback-hint">

                              <span className="analysis-label">
                                💡 NEXT HINT
                              </span>

                              <p>
                                {
                                  answerFeedback.hint
                                }
                              </p>

                            </div>

                          )}

                          {answerFeedback.question && (

                            <div className="answer-feedback-question">

                              <span className="analysis-label">
                                🤔 THINK ABOUT THIS
                              </span>

                              <p>
                                {
                                  answerFeedback.question
                                }
                              </p>

                            </div>

                          )}

                        </div>

                      )}

                    </div>

                  </>

                )}

                {/* FIXED CODE */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    🔧 FIXED CODE
                  </span>

                  {debuggingMode ===
                  'debug' ? (

                    <pre className="fixed-code">

                      <code>
                        {
                          result.fixedCode
                        }
                      </code>

                    </pre>

                  ) : !showFix ? (

                    <div className="reveal-fix-container">

                      <p>
                        Think you've found the
                        problem? Reveal the solution
                        when you're ready.
                      </p>

                      <button
                        className="reveal-fix-button"
                        onClick={() =>
                          setShowFix(true)
                        }
                      >
                        🔓 Reveal Fix
                      </button>

                    </div>

                  ) : (

                    <div>

                      <pre className="fixed-code">

                        <code>
                          {
                            result.fixedCode
                          }
                        </code>

                      </pre>

                      <button
                        className="hide-fix-button"
                        onClick={() =>
                          setShowFix(false)
                        }
                      >
                        Hide Fix
                      </button>

                    </div>

                  )}

                </div>

                {/* WHY */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    📖 WHY
                  </span>

                  <p>
                    {result.explanation}
                  </p>

                </div>

                {/* CONCEPT */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    🧠 CONCEPT
                  </span>

                  <p>
                    {normalizeConcept(
                      result.concept
                    )}
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

      {/* ==========================================
          PROGRESS MODAL
          ========================================== */}

      {showProgress && (

        <div
          className="progress-overlay"
          onClick={() =>
            setShowProgress(false)
          }
        >

          <div
            className="progress-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="progress-header">

              <div>

                <h2>
                  Your Progress
                </h2>

                <p>
                  See what you're learning and
                  where you're improving.
                </p>

              </div>

              <button
                className="close-progress-button"
                onClick={() =>
                  setShowProgress(false)
                }
              >
                ✕
              </button>

            </div>

            {history.length === 0 ? (

              <div className="progress-empty">

                <div className="progress-empty-icon">
                  📊
                </div>

                <h3>
                  Your progress starts here.
                </h3>

                <p>
                  Debug your first piece of code
                  and CodeDoctor will start
                  tracking your learning journey.
                </p>

              </div>

            ) : (

              <>

                {/* STATS */}

                <div className="progress-stats">

                  <div className="progress-stat">

                    <span className="progress-stat-number">
                      {history.length}
                    </span>

                    <span className="progress-stat-label">
                      Sessions
                    </span>

                  </div>

                  <div className="progress-stat">

                    <span className="progress-stat-number">
                      {
                        Object.keys(
                          conceptCounts
                        ).length
                      }
                    </span>

                    <span className="progress-stat-label">
                      Concepts
                    </span>

                  </div>

                  <div className="progress-stat">

                    <span className="progress-stat-number">
                      {
                        Object.keys(
                          languageCounts
                        ).length
                      }
                    </span>

                    <span className="progress-stat-label">
                      Languages
                    </span>

                  </div>

                </div>

                {/* HIGHLIGHTS */}

                <div className="progress-highlight-grid">

                  <div className="progress-highlight">

                    <span className="analysis-label">
                      💪 STRONGEST CONCEPT
                    </span>

                    <h3>
                      {strongestConcept
                        ? strongestConcept.concept
                        : '—'}
                    </h3>

                    <p>
                      {strongestConcept
                        ? `${strongestConceptScore}% learning performance across ${strongestConcept.attempts} ${
                            strongestConcept.attempts ===
                            1
                              ? 'attempt'
                              : 'attempts'
                          }.`
                        : 'Complete Learning Mode answers to discover your strongest concepts.'}
                    </p>

                  </div>

                  <div className="progress-highlight">

                    <span className="analysis-label">
                      🎯 NEEDS PRACTICE
                    </span>

                    <h3>
                      {weakestConcept
                        ? weakestConcept.concept
                        : '—'}
                    </h3>

                    <p>
                      {weakestConcept
                        ? `${weakestConceptScore}% learning performance. Keep practicing this concept to strengthen your understanding.`
                        : 'Complete Learning Mode answers to identify concepts that need more practice.'}
                    </p>

                  </div>

                  <div className="progress-highlight">

                    <span className="analysis-label">
                      💻 MOST PRACTICED LANGUAGE
                    </span>

                    <h3>
                      {strongestLanguage}
                    </h3>

                    <p>
                      {
                        languageCounts[
                          strongestLanguage
                        ] || 0
                      }{' '}
                      debugging session
                      {(
                        languageCounts[
                          strongestLanguage
                        ] || 0
                      ) !== 1
                        ? 's'
                        : ''}
                    </p>

                  </div>

                </div>

                {/* LANGUAGES */}

                <div className="progress-section">

                  <span className="analysis-label">
                    💻 LANGUAGES
                  </span>

                  <div className="progress-list">

                    {sortedLanguages.map(
                      ([
                        itemLanguage,
                        count,
                      ]) => {

                        const percentage =
                          Math.round(
                            (count /
                              history.length) *
                              100
                          );

                        return (
                          <div
                            className="progress-row"
                            key={
                              itemLanguage
                            }
                          >

                            <div className="progress-row-top">

                              <span>
                                {
                                  itemLanguage
                                }
                              </span>

                              <span>
                                {count}
                              </span>

                            </div>

                            <div className="progress-bar">

                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* CONCEPT COVERAGE */}

                <div className="progress-section">

                  <span className="analysis-label">
                    🧠 CONCEPTS
                  </span>

                  <div className="progress-list">

                    {sortedConcepts
                      .slice(0, 6)
                      .map(
                        ([
                          concept,
                          count,
                        ]) => {

                          const percentage =
                            Math.round(
                              (count /
                                history.length) *
                                100
                            );

                          return (
                            <div
                              className="progress-row"
                              key={
                                concept
                              }
                            >

                              <div className="progress-row-top">

                                <span>
                                  {
                                    concept
                                  }
                                </span>

                                <span>
                                  {count}
                                </span>

                              </div>

                              <div className="progress-bar">

                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />

                              </div>

                            </div>
                          );
                        }
                      )}

                  </div>

                </div>

                {/* LEARNING PERFORMANCE */}

                <div className="progress-section">

                  <div className="progress-section-header">

                    <div>

                      <h3>
                        Learning Performance
                      </h3>

                      <p>
                        See how well you're
                        understanding the problems
                        you practice.
                      </p>

                    </div>

                  </div>

                  {totalAnswerAttempts === 0 ? (

                    <div className="progress-performance-empty">

                      <div className="progress-performance-icon">
                        🧠
                      </div>

                      <h4>
                        Your learning score starts here.
                      </h4>

                      <p>
                        Use <strong>Your Turn</strong>{' '}
                        in Learning Mode and check your
                        answer to start tracking how well
                        you're understanding each concept.
                      </p>

                    </div>

                  ) : (

                    <>

                      <div className="learning-score-grid">

                        <div className="learning-score-card">

                          <span className="learning-score-label">
                            LEARNING SCORE
                          </span>

                          <strong className="learning-score-number">
                            {learningScore}%
                          </strong>

                          <span className="learning-score-description">
                            Based on correct and
                            partially correct answers.
                          </span>

                        </div>

                        <div className="learning-score-card">

                          <span className="learning-score-label">
                            ACCURACY
                          </span>

                          <strong className="learning-score-number">
                            {answerAccuracy}%
                          </strong>

                          <span className="learning-score-description">
                            Fully correct answers only.
                          </span>

                        </div>

                      </div>

                      <div className="learning-result-breakdown">

                        <div className="learning-result-item">

                          <span className="learning-result-icon">
                            ✅
                          </span>

                          <div>

                            <strong>
                              {correctAnswers}
                            </strong>

                            <span>
                              Correct
                            </span>

                          </div>

                        </div>

                        <div className="learning-result-item">

                          <span className="learning-result-icon">
                            🟡
                          </span>

                          <div>

                            <strong>
                              {partialAnswers}
                            </strong>

                            <span>
                              Partially correct
                            </span>

                          </div>

                        </div>

                        <div className="learning-result-item">

                          <span className="learning-result-icon">
                            ❌
                          </span>

                          <div>

                            <strong>
                              {incorrectAnswers}
                            </strong>

                            <span>
                              Incorrect
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="learning-score-progress">

                        <div className="learning-score-progress-header">

                          <span>
                            Learning progress
                          </span>

                          <strong>
                            {learningScore}%
                          </strong>

                        </div>

                        <div className="progress-bar">

                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${learningScore}%`,
                            }}
                          />

                        </div>

                      </div>

                      <p className="learning-attempts">

                        You've checked{' '}
                        {totalAnswerAttempts}{' '}
                        {totalAnswerAttempts === 1
                          ? 'learning answer'
                          : 'learning answers'}{' '}
                        so far.

                      </p>

                    </>

                  )}

                </div>

                {/* CONCEPT PERFORMANCE */}

                <div className="progress-section">

                  <div className="progress-section-header">

                    <div>

                      <h3>
                        Concept Performance
                      </h3>

                      <p>
                        See how well you're
                        understanding each concept
                        you've been tested on.
                      </p>

                    </div>

                  </div>

                  {conceptPerformance.length === 0 ? (

                    <div className="progress-performance-empty">

                      <div className="progress-performance-icon">
                        🧠
                      </div>

                      <h4>
                        Your concept performance
                        starts here.
                      </h4>

                      <p>
                        Use Learning Mode and check
                        your answers to see which
                        concepts you're mastering
                        and which ones need more
                        practice.
                      </p>

                    </div>

                  ) : (

                    <div className="concept-performance-list">

                      {[...conceptPerformance]
                        .sort(
                          (a, b) => {

                            if (
                              b.attempts !==
                              a.attempts
                            ) {
                              return (
                                b.attempts -
                                a.attempts
                              );
                            }

                            if (
                              b.percentage !==
                              a.percentage
                            ) {
                              return (
                                b.percentage -
                                a.percentage
                              );
                            }

                            return a.concept.localeCompare(
                              b.concept
                            );
                          }
                        )
                        .slice(0, 8)
                        .map((item) => (

                          <div
                            className="concept-performance-row"
                            key={
                              item.concept
                            }
                          >

                            <div className="concept-performance-top">

                              <div>

                                <strong>
                                  {
                                    item.concept
                                  }
                                </strong>

                                <span>
                                  {item.attempts}{' '}
                                  {item.attempts ===
                                  1
                                    ? 'attempt'
                                    : 'attempts'}
                                </span>

                              </div>

                              <strong>
                                {
                                  item.percentage
                                }%
                              </strong>

                            </div>

                            <div className="progress-bar">

                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${item.percentage}%`,
                                }}
                              />

                            </div>

                          </div>

                        ))}

                    </div>

                  )}

                </div>

                {/* CURRENT FOCUS */}

                <div className="progress-focus">

                  <span className="analysis-label">
                    🎯 YOUR CURRENT FOCUS
                  </span>

                  <p>

                    {weakestConcept
                      ? `Based on your Learning Mode results, ${weakestConcept.concept} is currently your biggest opportunity for improvement. Keep practicing it and try applying it in different problems.`
                      : mostPracticedConcept !==
                        '—'
                        ? `You've been practicing ${mostPracticedConcept} most often. Keep working on it and look for opportunities to apply it in new problems.`
                        : 'Keep debugging and using Learning Mode. CodeDoctor will identify the concepts you practice most and where you need more work.'}

                  </p>

                </div>

              </>

            )}

          </div>

        </div>

      )}

      {/* ==========================================
          HISTORY MODAL
          ========================================== */}

      {showHistory && (

        <div
          className="history-overlay"
          onClick={() => {

            setShowHistory(false);
            setHistorySearch('');
            setHistoryFilter('all');

          }}
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
                  Review what you've debugged
                  and learned.
                </p>

              </div>

              <div className="history-header-actions">

                {history.length > 0 && (

                  <button
                    className="clear-history-button"
                    onClick={
                      clearHistory
                    }
                  >
                    Clear All
                  </button>

                )}

                <button
                  className="close-history-button"
                  onClick={() => {

                    setShowHistory(false);
                    setHistorySearch('');
                    setHistoryFilter(
                      'all'
                    );

                  }}
                >
                  ✕
                </button>

              </div>

            </div>

            {history.length > 0 && (

              <>

                <div className="history-stats">

                  <div className="history-stat">

                    <span className="history-stat-number">
                      {history.length}
                    </span>

                    <span className="history-stat-label">
                      Sessions
                    </span>

                  </div>

                  <div className="history-stat">

                    <span className="history-stat-number">
                      {
                        new Set(
                          history.map(
                            (item) =>
                              normalizeConcept(
                                item.concept
                              )
                          )
                        ).size
                      }
                    </span>

                    <span className="history-stat-label">
                      Concepts
                    </span>

                  </div>

                  <div className="history-stat">

                    <span className="history-stat-number">
                      {
                        new Set(
                          history.map(
                            (item) =>
                              item.language
                          )
                        ).size
                      }
                    </span>

                    <span className="history-stat-label">
                      Languages
                    </span>

                  </div>

                </div>

                <div className="history-controls">

                  <input
                    type="text"
                    className="history-search"
                    value={
                      historySearch
                    }
                    onChange={(
                      event
                    ) =>
                      setHistorySearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search your debugging history..."
                  />

                  <select
                    className="history-filter"
                    value={
                      historyFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setHistoryFilter(
                        event.target
                          .value
                      )
                    }
                  >

                    <option value="all">
                      All Languages
                    </option>

                    {historyLanguages.map(
                      (
                        itemLanguage
                      ) => (

                        <option
                          key={
                            itemLanguage
                          }
                          value={
                            itemLanguage
                          }
                        >
                          {
                            itemLanguage
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

              </>

            )}

            {history.length === 0 ? (

              <div className="history-empty">

                <div className="history-empty-icon">
                  🕘
                </div>

                <h3>
                  No debugging history yet.
                </h3>

                <p>
                  Your analyzed code will
                  appear here so you can
                  come back to it later.
                </p>

              </div>

            ) : filteredHistory.length ===
              0 ? (

              <div className="history-empty">

                <div className="history-empty-icon">
                  🔎
                </div>

                <h3>
                  No matching sessions.
                </h3>

                <p>
                  Try a different search or
                  language filter.
                </p>

              </div>

            ) : (

              <div className="history-list">

                {filteredHistory.map(
                  (item) => (

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

                    <div className="history-concept">

                      <span className="analysis-label">
                        🧠 CONCEPT
                      </span>

                      <span>
                        {normalizeConcept(
                          item.concept
                        )}
                      </span>

                    </div>

                    {item.answerResult && (

                      <div className="history-learning-result">

                        <span className="analysis-label">
                          ✍️ LEARNING RESULT
                        </span>

                        <span>

                          {item.answerResult ===
                          'CORRECT'
                            ? '✅ Correct'
                            : item.answerResult ===
                              'PARTIALLY_CORRECT'
                              ? '🟡 Partially Correct'
                              : item.answerResult ===
                                'INCORRECT'
                                ? '❌ Incorrect'
                                : item.answerResult}

                        </span>

                      </div>

                    )}

                    <div className="history-actions">

                      <button
                        className="load-session-button"
                        onClick={() =>
                          loadHistorySession(
                            item
                          )
                        }
                      >
                        Load Session
                      </button>

                      <button
                        className="delete-history-button"
                        onClick={() =>
                          deleteHistoryItem(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                )
                )}

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
          onClick={() =>
            setShowSettings(false)
          }
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
                  Customize how CodeDoctor
                  helps you learn.
                </p>

              </div>

              <button
                className="close-settings-button"
                onClick={() =>
                  setShowSettings(false)
                }
              >
                ✕
              </button>

            </div>

            <div className="settings-content">

              {/* EXPLANATION LEVEL */}

              <div className="setting-item">

                <div className="setting-info">

                  <h3>
                    Explanation Level
                  </h3>

                  <p>
                    Choose how detailed
                    CodeDoctor's explanations
                    should be.
                  </p>

                </div>

                <select
                  className="settings-select"
                  value={
                    explanationLevel
                  }
                  onChange={(event) =>
                    changeExplanationLevel(
                      event.target
                        .value
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

              {/* DEBUGGING MODE */}

              <div className="setting-item">

                <div className="setting-info">

                  <h3>
                    Debugging Mode
                  </h3>

                  <p>
                    Choose between learning
                    with guidance or getting
                    straight to the solution.
                  </p>

                </div>

                <select
                  className="settings-select"
                  value={
                    debuggingMode
                  }
                  onChange={(event) =>
                    changeDebuggingMode(
                      event.target
                        .value
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

              {/* APPEARANCE */}

              <div className="setting-item">

                <div className="setting-info">

                  <h3>
                    Appearance
                  </h3>

                  <p>
                    Choose how CodeDoctor
                    looks.
                  </p>

                </div>

                <select
                  className="settings-select"
                  value={theme}
                  onChange={(event) =>
                    changeTheme(
                      event.target
                        .value
                    )
                  }
                >

                  <option value="dark">
                    Dark
                  </option>

                  <option value="light">
                    Light
                  </option>

                </select>

              </div>

              {/* CLEAR HISTORY */}

              <div className="setting-item">

                <div className="setting-info">

                  <h3>
                    Debug History
                  </h3>

                  <p>
                    Delete all saved
                    debugging sessions
                    from this device.
                  </p>

                </div>

                <button
                  className="settings-danger-button"
                  onClick={
                    clearHistory
                  }
                  disabled={
                    history.length ===
                    0
                  }
                >
                  Clear History
                </button>

              </div>

              {/* ABOUT */}

              <div className="setting-item settings-about">

                <div className="setting-info">

                  <h3>
                    About CodeDoctor
                  </h3>

                  <p>
                    An AI-powered coding
                    debugger and learning
                    assistant designed to
                    help developers understand
                    their mistakes.
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