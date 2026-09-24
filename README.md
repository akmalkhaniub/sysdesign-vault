# 🏛️ System Design Master Vault

**An interactive, full-stack knowledge base, spaced-repetition trainer, and interview preparation platform for distributed systems architects.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-336791.svg)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20%7C%20Python-blue.svg)](https://www.typescriptlang.org/)

---

## 🌟 Overview

**System Design Master Vault** is an all-in-one distributed systems curriculum and interview prep engine. It brings together curated video breakdowns from top engineering channels, time-synchronized transcripts, interactive architecture presets, flashcards with SM2 spaced repetition, and an automated Obsidian vault markdown exporter.

```mermaid
flowchart TD
    subgraph Ingestion["Ingestion & Sync Layer"]
        RSS["YouTube Channel RSS Ingestion"]
        Transcripts["Transcript Segment Parser & Rich Formatter"]
    end

    subgraph Core["FastAPI 2.0 Async Engine"]
        API["FastAPI REST Services"]
        SM2["SM2 Spaced Repetition Algorithm"]
        Search["Full-Text Transcript & Chapter Search"]
        VaultExport["Obsidian Markdown & ZIP Vault Exporter"]
    end

    subgraph Storage["Persistence Layer"]
        DB[("PostgreSQL / SQLite via SQLAlchemy Async")]
    end

    subgraph UI["Next.js 14 Client HUD"]
        Dashboard["Catalog & Topic Matrix"]
        Flashcards["Interactive SM2 Flashcard Deck"]
        MockInterview["Mock Architectural Interview Simulator"]
        MermaidViewer["Mermaid Architecture Presets & Canvas"]
    end

    RSS --> API
    Transcripts --> API
    API <--> DB
    API --> SM2
    API --> Search
    API --> VaultExport
    UI <--> API
```

---

## ✨ Features

- 📚 **System Design Topic Catalog**: Curated deep dives across Rate Limiters, Distributed Caching, Message Queues, Consensus (Raft/Paxos), Consistent Hashing, Sharding, and API Gateways.
- 🧠 **SM2 Spaced Repetition Engine**: Calculates optimal review intervals, easiness factor ($EF$), and repetition intervals based on user confidence ratings (0–5).
- 🔍 **Time-Synchronized Transcript Search**: Full-text keyword and semantic search across video chapters, timestamps, and transcripts.
- 📦 **Obsidian Vault Exporter**: 1-click generation of fully formatted, cross-linked Obsidian markdown vaults with YAML frontmatter, tags, and Mermaid diagrams.
- 🎙️ **Mock Architectural Interview Simulator**: Real-time evaluation prompts and scoring rubrics for FAANG-level system design rounds.
- 🎨 **Interactive Diagram Presets**: Ready-to-use Mermaid and Cytoscape architecture patterns for distributed workflows.

---

## 🏗️ Architecture & Tech Stack

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy Async, Pydantic v2, aiosqlite / asyncpg, Uvicorn
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Mermaid.js
- **Persistence:** SQLite for zero-config local development; PostgreSQL support for cloud production.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application dashboard will be live at `http://localhost:3000`.

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
