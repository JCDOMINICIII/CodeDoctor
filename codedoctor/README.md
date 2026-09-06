# 🐛 CodeDoctor

### Don't just fix your code. Understand it.

CodeDoctor is an AI-powered debugging assistant designed to help developers understand **why their code is broken**, not just receive a corrected version.

Paste your code, choose your programming language, and CodeDoctor analyzes the problem, explains why it happens, provides a fix, identifies the programming concept involved, and gives you a learning tip.

## 🚀 Live Demo

**[Try CodeDoctor](https://codedoctor-uejj.onrender.com)**

## 💡 The Problem

When beginners encounter a programming error, the easiest solution is often to copy an answer from Stack Overflow, Google, or an AI assistant.

The code may work — but the developer may still not understand **why it was broken in the first place**.

CodeDoctor focuses on turning debugging into a learning experience.

## ✨ Features

* 🐛 **Bug Detection** — identifies problems in your code
* 💡 **Clear Explanations** — explains why the problem happens
* 🔧 **Fixed Code** — provides a corrected version
* 🧠 **Concept Identification** — connects the bug to a programming concept
* 📚 **Learning Tips** — provides advice to help developers avoid similar mistakes
* ⚡ **AI-Powered Analysis** — uses Google's Gemini models to analyze submitted code

## 🧠 How It Works

```text
Developer
    ↓
Paste Code
    ↓
CodeDoctor Frontend
    ↓
FastAPI Backend
    ↓
Gemini AI
    ↓
Structured Debugging Analysis
    ↓
Developer Learns From The Error
```

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Python
* FastAPI
* Uvicorn

### AI

* Google Gemini
* Gemini OpenAI-compatible API

### Deployment

* Render
* GitHub

## 🎯 Example

### Broken Code

```javascript
const name = "Jethro";

console.log(nam);
```

### CodeDoctor identifies

**Problem:** `nam` is not defined.

**Explanation:** The variable was declared as `name`, but the code attempts to access `nam`.

**Fixed Code:**

```javascript
const name = "Jethro";

console.log(name);
```

**Concept:** Variables and reference errors.

**Learning Tip:** Always check that the variable name you use matches the name you declared.

## 🌱 Future Vision

CodeDoctor is currently an MVP, but the long-term vision is to become an AI-powered learning companion for developers.

Potential future features include:

* Interactive debugging lessons
* Personalized learning paths
* Coding exercises generated from a user's mistakes
* Developer skill and weakness tracking
* VS Code extension
* Support for more programming languages
* AI-powered code reviews
* University and bootcamp integrations

## 👨🏽‍💻 Built For

**MIVA May Cohort 25 AI Build Challenge**

Built as a lightweight functional AI application demonstrating how AI can transform debugging from a frustrating experience into an opportunity to learn.

## 📄 License

This project is currently an MVP created for educational and hackathon purposes.
