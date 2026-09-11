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
    'async programming': 'Async Programming',
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

  if (
    normalized.includes('variable') ||
    normalized === 'const' ||
    normalized === 'let' ||
    normalized === 'var' ||
    normalized.includes('constant')
  ) {
    return 'Variables';
  }

  if (
    normalized.includes('function') ||
    normalized.includes('parameter') ||
    normalized.includes('argument') ||
    normalized.includes('return value')
  ) {
    return 'Functions';
  }

  if (normalized.includes('array')) {
    return 'Arrays';
  }

  if (normalized.includes('list')) {
    return 'Lists';
  }

  if (normalized.includes('dictionary')) {
    return 'Dictionaries';
  }

  if (
    normalized.includes('object') ||
    normalized.includes('property')
  ) {
    return 'Objects';
  }

  if (
    normalized.includes('loop') ||
    normalized.includes('iteration')
  ) {
    return 'Loops';
  }

  if (
    normalized.includes('conditional') ||
    normalized.includes('if statement') ||
    normalized.includes('if/else') ||
    normalized.includes('branching')
  ) {
    return 'Conditionals';
  }

  if (
    normalized.includes('dom') ||
    normalized.includes('document object model') ||
    normalized.includes('html element')
  ) {
    return 'DOM';
  }

  if (
    normalized.includes('event') ||
    normalized.includes('event listener')
  ) {
    return 'Events';
  }

  if (
    normalized.includes('error handling') ||
    normalized.includes('exception') ||
    normalized.includes('try/catch') ||
    normalized.includes('try catch')
  ) {
    return 'Error Handling';
  }

  if (
    normalized.includes('data type') ||
    normalized.includes('datatype')
  ) {
    return 'Data Types';
  }

  if (
    normalized.includes('class') ||
    normalized.includes('oop') ||
    normalized.includes('object-oriented')
  ) {
    return 'OOP';
  }

  return concept.trim();
};

// ==========================================
// DIAGNOSIS HELPERS
// ==========================================

const normalizeDiagnosisType = (type) => {
  const value = String(type || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  const aliases = {
    correct: 'correct',
    no_error: 'correct',
    no_errors: 'correct',

    syntax: 'syntax_error',
    syntax_error: 'syntax_error',
    syntaxerror: 'syntax_error',

    runtime: 'runtime_error',
    runtime_error: 'runtime_error',
    runtimeerror: 'runtime_error',

    type: 'type_error',
    type_error: 'type_error',
    typeerror: 'type_error',

    logic: 'logic_error',
    logic_error: 'logic_error',
    logicerror: 'logic_error',

    compilation: 'compilation_error',
    compilation_error: 'compilation_error',
    compilationerror: 'compilation_error',
    compiler_error: 'compilation_error',

    wrong_output: 'wrong_output',
    wrongoutput: 'wrong_output',
    output_error: 'wrong_output',

    environment: 'environment_error',
    environment_error: 'environment_error',
    environmenterror: 'environment_error',
  };

  return aliases[value] || value || 'unknown';
};

const diagnosisLabel = (type) => {
  const labels = {
    correct: 'Correct',
    syntax_error: 'Syntax Error',
    runtime_error: 'Runtime Error',
    type_error: 'Type Error',
    logic_error: 'Logic Error',
    compilation_error: 'Compilation Error',
    wrong_output: 'Wrong Output',
    environment_error: 'Environment Error',
    unknown: 'Analysis',
  };

  return labels[normalizeDiagnosisType(type)] || 'Analysis';
};

const evidenceTitle = (type) => {
  const titles = {
    correct: 'OUTPUT / EVIDENCE',
    syntax_error: 'SYNTAX ERROR',
    runtime_error: 'RUNTIME ERROR',
    type_error: 'TYPE ERROR',
    compilation_error: 'COMPILER ERROR',
    logic_error: 'OUTPUT / LOGIC ANALYSIS',
    wrong_output: 'OUTPUT / LOGIC ANALYSIS',
    environment_error: 'ENVIRONMENT ERROR',
    unknown: 'ANALYSIS EVIDENCE',
  };

  return (
    titles[normalizeDiagnosisType(type)] ||
    'ANALYSIS EVIDENCE'
  );
};

const cleanFixedCode = (value) => {
  if (!value) {
    return '';
  }

  let cleaned = String(value).trim();

  cleaned = cleaned.replace(/^```[a-zA-Z0-9_+#-]*\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  return cleaned.trim();
};

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const normalizeAlternative = (alternative) => {
  if (typeof alternative === 'string') {
    return {
      title: 'Alternative',
      description: alternative,
      tradeoff: '',
      code: '',
    };
  }

  if (!alternative || typeof alternative !== 'object') {
    return null;
  }

  return {
    title:
      alternative.title ||
      'Alternative',

    description:
      alternative.description ||
      alternative.explanation ||
      '',

    tradeoff:
      alternative.tradeoff ||
      alternative.tradeoffs ||
      '',

    code:
      cleanFixedCode(
        alternative.code || ''
      ),
  };
};

const normalizeQualitySuggestion = (
  suggestion
) => {
  if (typeof suggestion === 'string') {
    return {
      area: 'General',
      suggestion,
    };
  }

  if (!suggestion || typeof suggestion !== 'object') {
    return null;
  }

  return {
    area:
      suggestion.area ||
      'General',

    suggestion:
      suggestion.suggestion ||
      suggestion.description ||
      '',
  };
};

// ==========================================
// APP
// ==========================================

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

  const [currentHistoryId, setCurrentHistoryId] =
    useState(null);

  // ==========================================
  // LEARNING MODE
  // ==========================================

  const [learningAnswer, setLearningAnswer] =
    useState('');

  const [answerFeedback, setAnswerFeedback] =
    useState(null);

  const [isEvaluatingAnswer, setIsEvaluatingAnswer] =
    useState(false);

  const [hasAttemptedAnswer, setHasAttemptedAnswer] =
    useState(false);

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

  const [historySearch, setHistorySearch] =
    useState('');

  const [historyFilter, setHistoryFilter] =
    useState('all');

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
      const parsedHistory =
        JSON.parse(savedHistory);

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
  // RESET CURRENT ANALYSIS
  // ==========================================

  const resetCurrentAnalysis = () => {
    setCurrentHistoryId(null);
    setRunResult(null);
    setResult(null);
    setShowFix(false);
    setLearningAnswer('');
    setAnswerFeedback(null);
    setHasAttemptedAnswer(false);
    setIsEvaluatingAnswer(false);
  };

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

      const analysisResult = {
  problem: data.problem || '',

  explanation:
    data.explanation || '',

  fixedCode: cleanFixedCode(
    data.fixed_code
  ),

  concept: normalizedConcept,

  learningTip:
    data.learning_tip || '',

  hint:
    data.hint || '',

  question:
    data.question || '',

  diagnosisType:
    normalizeDiagnosisType(
      data.diagnosisType || 'unknown'
    ),

  severity:
    data.severity || 'Medium',

  location:
    data.location || '',

  evidence:
    data.evidence || '',

  debugSteps:
    safeArray(data.debugSteps),

  rootCause:
    data.rootCause || '',

  fixSummary:
    data.fixSummary || '',

  alternatives:
    safeArray(data.alternatives)
      .map(normalizeAlternative)
      .filter(Boolean),

  qualitySuggestions:
    safeArray(data.qualitySuggestions)
      .map(normalizeQualitySuggestion)
      .filter(Boolean),

  beginnerMistakes:
    safeArray(data.beginnerMistakes),

  expectedBehavior:
    data.expectedBehavior || '',

  actualBehavior:
    data.actualBehavior || '',

  changeExplanation:
    data.changeExplanation || '',

  runtimeContext:
    data.runtimeContext || '',
};

      const newHistoryItem = {
        id: Date.now(),
        code,
        language,
        debuggingMode,

        ...analysisResult,

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

      setResult(analysisResult);
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

        diagnosisType:
          'Environment Error',

        severity:
          'High',

        location:
          'CodeDoctor backend connection',

        evidence:
          error.message || 'No backend response.',

        debugSteps: [
          'Check that the backend server is running.',
          'Check your network connection.',
          'Try debugging again.',
        ],

        rootCause:
          'CodeDoctor could not communicate with the analysis backend.',

        fixSummary:
          'No code change was made because the analysis service was unavailable.',

        alternatives: [],

        qualitySuggestions: [],

        beginnerMistakes: [],
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

            problem:
              result.problem,

            explanation:
              result.explanation,

            learningAnswer,

            diagnosisType:
              result.diagnosisType || '',

            rootCause:
              result.rootCause || '',

            debugSteps:
              result.debugSteps || [],
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

      const score =
        Number.isFinite(
          Number(data.score)
        )
          ? Math.max(
              0,
              Math.min(
                100,
                Number(data.score)
              )
            )
          : 0;

      let resultStatus =
        data.result;

      if (!resultStatus) {
        if (score >= 70) {
          resultStatus = 'CORRECT';
        } else if (score >= 40) {
          resultStatus =
            'PARTIALLY_CORRECT';
        } else {
          resultStatus = 'INCORRECT';
        }
      }

      setAnswerFeedback({
        result: resultStatus,
        score,

        feedback:
          data.feedback || '',

        hint:
          data.nextHint ||
          data.hint ||
          '',

        question:
          data.question || '',

        whatTheyGotRight:
          data.whatTheyGotRight || '',

        whatTheyMissed:
          data.whatTheyMissed || '',
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
                resultStatus,

              answerScore:
                score,

              answerFeedback:
                data.feedback || '',

              whatTheyGotRight:
                data.whatTheyGotRight ||
                '',

              whatTheyMissed:
                data.whatTheyMissed ||
                '',
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
        score: 0,

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
      fixedCode: cleanFixedCode(
        item.fixedCode
      ),
      concept: normalizeConcept(
        item.concept
      ),
      learningTip:
        item.learningTip || '',
      hint: item.hint || '',
      question:
        item.question || '',

      diagnosisType:
        item.diagnosisType ||
        'Correct',

      severity:
        item.severity || 'Medium',

      location:
        item.location || '',

      evidence:
        item.evidence || '',

      debugSteps:
        safeArray(item.debugSteps),

      rootCause:
        item.rootCause || '',

      fixSummary:
        item.fixSummary || '',

      alternatives:
        safeArray(item.alternatives),

      qualitySuggestions:
        safeArray(
          item.qualitySuggestions
        ),

      beginnerMistakes:
        safeArray(
          item.beginnerMistakes
        ),
    });

    setRunResult(null);
    setShowFix(false);

    setLearningAnswer('');
    setHasAttemptedAnswer(false);
    setIsEvaluatingAnswer(false);

    if (item.answerResult) {
      setAnswerFeedback({
        result:
          item.answerResult,

        score:
          item.answerScore || 0,

        feedback:
          item.answerFeedback ||
          'You previously checked your answer for this session.',

        hint: '',

        question: '',

        whatTheyGotRight:
          item.whatTheyGotRight ||
          '',

        whatTheyMissed:
          item.whatTheyMissed ||
          '',
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

      const diagnosis =
        diagnosisLabel(
          item.diagnosisType
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
        diagnosis
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
            onClick={() =>
              setShowProgress(true)
            }
          >
            Progress
          </button>

          <button
            onClick={() =>
              setShowHistory(true)
            }
          >
            History
          </button>

          <button
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

                  resetCurrentAnalysis();

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

                resetCurrentAnalysis();

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

                    <p>
                      If the output is not what
                      you expected, click{' '}
                      <strong>
                        Debug Code
                      </strong>{' '}
                      and CodeDoctor will analyze
                      the result against your code.
                    </p>

                  </div>

                )}

                {!runResult.success && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🩺 NEXT STEP
                    </span>

                    <p>
                      CodeDoctor found an execution
                      or compiler problem. Click{' '}
                      <strong>
                        Debug Code
                      </strong>{' '}
                      so the AI can use the actual
                      error as evidence.
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

                {/* DIAGNOSIS */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    🩺 DIAGNOSIS
                  </span>

                  <h2>
                    {diagnosisLabel(
                      result.diagnosisType
                    )}
                  </h2>

                  <p>
                    <strong>
                      {result.problem}
                    </strong>
                  </p>

                  {result.severity && (
                    <p>
                      Severity:{' '}
                      <strong>
                        {result.severity}
                      </strong>
                    </p>
                  )}

                </div>

                {/* WHAT'S WRONG */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    🚨 WHAT'S WRONG
                  </span>

                  <p>
                    {result.problem}
                  </p>

                </div>

                {/* EVIDENCE */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    🔎 {evidenceTitle(
                      result.diagnosisType
                    )}
                  </span>

                  {result.location && (
                    <p>
                      <strong>
                        Location:
                      </strong>{' '}
                      {result.location}
                    </p>
                  )}

                  <pre className="fixed-code">
                    <code>
                      {result.evidence ||
                        'No additional evidence provided.'}
                    </code>
                  </pre>

                </div>

                {/* ROOT CAUSE */}

                {result.rootCause && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🎯 ROOT CAUSE
                    </span>

                    <p>
                      {result.rootCause}
                    </p>

                  </div>

                )}

                {/* EXPECTED VS ACTUAL */}

                {(
                  result.expectedBehavior ||
                  result.actualBehavior
                ) && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      📊 EXPECTED VS ACTUAL
                    </span>

                    {result.expectedBehavior && (
                      <p>
                        <strong>
                          Expected:
                        </strong>{' '}
                        {result.expectedBehavior}
                      </p>
                    )}

                    {result.actualBehavior && (
                      <p>
                        <strong>
                          Actual:
                        </strong>{' '}
                        {result.actualBehavior}
                      </p>
                    )}

                  </div>

                )}

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

                          {answerFeedback.score !==
                            undefined && (
                            <p>
                              Score:{' '}
                              <strong>
                                {
                                  answerFeedback.score
                                }%
                              </strong>
                            </p>
                          )}

                          <p>
                            {
                              answerFeedback.feedback
                            }
                          </p>

                          {answerFeedback.whatTheyGotRight && (

                            <div className="answer-feedback-hint">

                              <span className="analysis-label">
                                ✅ WHAT YOU GOT RIGHT
                              </span>

                              <p>
                                {
                                  answerFeedback.whatTheyGotRight
                                }
                              </p>

                            </div>

                          )}

                          {answerFeedback.whatTheyMissed && (

                            <div className="answer-feedback-hint">

                              <span className="analysis-label">
                                📌 WHAT YOU MISSED
                              </span>

                              <p>
                                {
                                  answerFeedback.whatTheyMissed
                                }
                              </p>

                            </div>

                          )}

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

                {/* DEBUG STEPS */}

                {result.debugSteps?.length > 0 && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🧭 DEBUGGING STEPS
                    </span>

                    <ol>
                      {result.debugSteps.map(
                        (step, index) => (
                          <li key={index}>
                            {step}
                          </li>
                        )
                      )}
                    </ol>

                  </div>

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

                {/* FIX SUMMARY */}

                {result.fixSummary && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🛠️ WHAT CHANGED
                    </span>

                    <p>
                      {result.fixSummary}
                    </p>

                  </div>

                )}

                {/* CHANGE EXPLANATION */}

                {result.changeExplanation && (
                  <div className="analysis-section">

                    <span className="analysis-label">
                      🧩 WHY THIS CHANGE FIXES IT
                    </span>

                    <p>
                      {result.changeExplanation}
                    </p>

                  </div>
                )}

                {/* RUNTIME CONTEXT */}

                {result.runtimeContext && (
                  <div className="analysis-section">

                    <span className="analysis-label">
                      ⚙️ RUNTIME CONTEXT
                    </span>

                    <p>
                      {result.runtimeContext}
                    </p>

                  </div>
                )}

                {/* WHY */}

                <div className="analysis-section">

                  <span className="analysis-label">
                    📖 WHY
                  </span>

                  <p>
                    {result.explanation}
                  </p>

                </div>

                {/* ALTERNATIVE SOLUTIONS */}

                {result.alternatives?.length > 0 && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🔀 ALTERNATIVE APPROACHES
                    </span>

                    {result.alternatives.map(
                      (alternative, index) => {

                        if (
                          typeof alternative ===
                          'string'
                        ) {
                          return (
                            <p key={index}>
                              <strong>
                                Option {index + 1}:
                              </strong>{' '}
                              {alternative}
                            </p>
                          );
                        }

                        return (
                          <div key={index}>

                            <p>
                              <strong>
                                {alternative.title ||
                                  `Option ${index + 1}`}
                              </strong>
                            </p>

                            {alternative.description && (
                              <p>
                                {
                                  alternative.description
                                }
                              </p>
                            )}

                            {alternative.tradeoff && (
                              <p>
                                <strong>
                                  Trade-off:
                                </strong>{' '}
                                {
                                  alternative.tradeoff
                                }
                              </p>
                            )}

                            {alternative.code && (
                              <pre className="fixed-code">
                                <code>
                                  {
                                    alternative.code
                                  }
                                </code>
                              </pre>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

                {/* CODE QUALITY */}

                {result.qualitySuggestions?.length > 0 && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      ✨ CODE QUALITY
                    </span>

                    {result.qualitySuggestions.map(
                      (suggestion, index) => {

                        if (
                          typeof suggestion ===
                          'string'
                        ) {
                          return (
                            <p key={index}>
                              • {suggestion}
                            </p>
                          );
                        }

                        return (
                          <div key={index}>

                            <p>
                              <strong>
                                {suggestion.area ||
                                  `Suggestion ${index + 1}`}
                              </strong>
                            </p>

                            {suggestion.suggestion && (
                              <p>
                                {
                                  suggestion.suggestion
                                }
                              </p>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

                {/* BEGINNER MISTAKES */}

                {result.beginnerMistakes?.length > 0 && (

                  <div className="analysis-section">

                    <span className="analysis-label">
                      🎓 BEGINNER MISTAKES
                    </span>

                    {result.beginnerMistakes.map(
                      (mistake, index) => (
                        <p key={index}>
                          • {mistake}
                        </p>
                      )
                    )}

                  </div>

                )}

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

                    <p>
                      <strong>
                        {diagnosisLabel(
                          item.diagnosisType
                        )}
                      </strong>
                    </p>

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
                  v3.0.0
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