# 🐛 CodeDoctor

### Don't just fix your code. Understand it.

CodeDoctor is an AI-powered coding assistant that helps developers **find bugs, understand why they happen, and learn how to fix them**.

Instead of simply giving you a corrected answer, CodeDoctor explains the problem like a coding teacher.

🌐 **Live Demo:** https://codedoctor-uejj.onrender.com

---

## 🚀 The Problem

When beginners encounter bugs, they often copy an error message into an AI tool and receive a solution without understanding what went wrong.

This creates a cycle of:

> **Bug → Copy solution → Paste solution → Move on → Learn nothing**

CodeDoctor takes a different approach.

It explains **what is wrong, why it is wrong, how to fix it, and what programming concept is involved.**

---

## 💡 What CodeDoctor Does

Paste your code, select your programming language, and click **Debug Code**.

CodeDoctor provides:

* 🐛 **What's Wrong** — identifies the main problem
* 💡 **Why** — explains why the problem occurs
* 🔧 **Fixed Code** — provides a corrected version
* 🧠 **Concept** — identifies the programming concept involved
* 📚 **Learning Tip** — gives advice to help prevent similar mistakes

---

## 🌎 Supported Languages

CodeDoctor currently supports:

* JavaScript
* Python
* TypeScript
* Java
* C++

The language selected by the user is sent to the AI so CodeDoctor can analyze the code according to the correct programming language.

---

## ⚙️ How It Works

```text
┌─────────────────────┐
│   User Pastes Code  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Select Programming  │
│      Language       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   React Frontend    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   FastAPI Backend   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Gemini AI       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Structured Analysis │
└─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Python
* FastAPI
* Pydantic
* Uvicorn

### AI

* Google Gemini API
* Gemini Flash Lite

### Deployment

* GitHub
* Render

---

## 🧪 Example

### Input

```javascript
const username = "Jethro";

console.log(usernme);
```

### CodeDoctor

**🐛 What's Wrong**

`usernme` is not defined.

**💡 Why**

The variable was created using the name `username`, but the code tries to access `usernme`.

**🔧 Fixed Code**

```javascript
const username = "Jethro";

console.log(username);
```

**🧠 Concept**

Variable naming and reference errors.

**📚 Learning Tip**

Make sure variable names are spelled consistently when declaring and using them.

---

## 🎯 Why CodeDoctor?

Most AI coding assistants focus on getting you the answer.

CodeDoctor focuses on helping you **understand the answer**.

The goal is to make debugging part of the learning process.

---

## 🔮 Future Vision

CodeDoctor is designed to grow beyond a simple debugging tool.

Future features could include:

* 📖 Interactive coding lessons
* 🧩 AI-generated coding exercises
* 📊 Personalized learning progress
* 🧠 Tracking recurring programming mistakes
* 💻 VS Code extension
* 📝 Debugging history
* 👨‍🏫 AI programming tutor
* 🎓 Tools for universities and coding bootcamps
* 🤝 Collaborative debugging

The long-term vision is to build an AI developer companion that helps programmers **become better developers, not just finish their code.**

---

## 🏆 Built For

**MIVA May Cohort 25 AI Build Challenge**

CodeDoctor was built as a lightweight, functional AI project focused on solving a real problem for beginner and intermediate programmers.

---

## 👨‍💻 Built With

Built with curiosity, caffeine, and a lot of debugging. ☕🐛

**CodeDoctor**

> Don't just fix your code. Understand it.
