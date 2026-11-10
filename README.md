# Tajweed AI Tutor: RAG-Based Education & Audio Recitation Feedback[cite: 1]

A Streamlit-based application designed to assist students in learning Tajweed rules through an AI-powered Arabic Q&A chatbot (built using Retrieval-Augmented Generation) and automated recitation feedback[cite: 1].

---

## 📌 Project Overview

Students learning Quranic Tajweed often face challenges in accessing clear explanations and receiving timely feedback on pronunciation[cite: 1]. The **Tajweed AI Tutor** addresses this gap by combining an Arabic Tajweed knowledge base indexed in a vector database with phoneme-level audio analysis[cite: 1].

> **Disclaimer:** This project is intended as an interactive educational assistant and study aid, not a replacement for a qualified Quran/Tajweed teacher[cite: 1].

---

## ✨ Key Features

* **Arabic Tajweed Q&A Chatbot:** Answers student questions using Retrieval-Augmented Generation (RAG) grounded in verified Arabic Tajweed textbooks with inline citations[cite: 1].
* **Audio Recitation Feedback (Planned):** Allows users to record or upload recitations (focusing initially on *Juz Amma*) to identify potential Tajweed errors[cite: 1].
* **Reference Audio Playback:** Plays verified Quranic recitation samples for comparison[cite: 1].
* **Interactive Makharij Visualizer:** Features an interactive 2D diagram of articulation points (*Makharij al-Huruf*) with clickable details[cite: 1].

---

## 🏗️ System Architecture

The project architecture consists of two interconnected pipelines[cite: 1]:

```text
+---------------------------------------------------------------------------------+
|                                Tajweed AI Tutor                                 |
+----------------------------------------+----------------------------------------+
                                         |
            +----------------------------+----------------------------+
            |                                                         |
            v                                                         v
  [ Knowledge & RAG Path ]                                  [ Audio Feedback Path ]
  - Baseer OCR Text Extraction                              - Juz Amma Selection
  - UTF-8 Markdown Cleaning                                 - Zipformer Phoneme Recognition
  - Multilingual Embeddings & Vector DB                     - MFA Forced Alignment
  - LLM Q&A with Sources                                    - Recitation Comparison
```[cite: 1]

### 1. Knowledge Base & RAG Pipeline
1. **Source Extraction:** Extracts Arabic text from authoritative Tajweed textbooks using **Baseer OCR**[cite: 1].
2. **Structuring:** Cleans diacritics/glyphs and organizes text into UTF-8 Markdown while preserving page references[cite: 1].
3. **Vector Indexing:** Chunks text and generates multilingual embeddings stored in a vector database[cite: 1].
4. **LLM Generation:** Retrieves relevant passages to generate source-grounded Arabic responses with citations[cite: 1].

### 2. Audio Recitation Pipeline (Planned)
1. **Input:** User selects an Ayah from *Juz Amma* and uploads/records their recitation[cite: 1].
2. **Phoneme Recognition:** Recognizes Quranic phonemes using **Zipformer**[cite: 1].
3. **Forced Alignment:** Applies Montreal Forced Aligner (**MFA**) for precise timestamp alignment[cite: 1].
4. **Rule Evaluation:** Compares recognized sounds and timings against expected Tajweed rules to explain suspected errors[cite: 1].

---

## 🛠️ Tech Stack

* **Frontend / UI:** Python, Streamlit[cite: 1]
* **OCR & Text Processing:** Baseer OCR (benchmarked against PDF parsers, Tesseract, EasyOCR, Kraken, and Gemini Vision)[cite: 1]
* **Embeddings & Vector Search:** Multilingual Embedding Models, Vector Database[cite: 1]
* **Speech Processing:** Zipformer (Quranic Phoneme Recognition), Montreal Forced Aligner (MFA)[cite: 1]

---

## 📊 Current Status & Data Challenges

### Completed Milestones
* Designed end-to-end two-part architecture (Arabic RAG + Audio Analysis)[cite: 1].
* Benchmarked multiple Arabic OCR solutions on sample pages and selected **Baseer OCR**[cite: 1].
* Initiated text extraction and Markdown cleaning with retained page references[cite: 1].

### Addressed Technical Challenges
* **Corrupted PDF Text:** Solved Arabic font encoding errors caused by native PDF parsers[cite: 1].
* **Diacritics & Layout:** Handled Arabic vocalization marks (*Tashkeel*), Quranic glyphs, right-to-left layout shifts, and footnotes[cite: 1].

---

## 🗺️ Project Roadmap

- [x] Architecture design & workflow specification[cite: 1]
- [x] OCR benchmarking & engine selection (Baseer OCR)[cite: 1]
- [ ] Arabic Tajweed textbook extraction & verification[cite: 1]
- [ ] Vector database chunking & embedding generation[cite: 1]
- [ ] RAG chatbot implementation with citation evaluation[cite: 1]
- [ ] Audio feedback pilot on *Juz Amma* recitations[cite: 1]
- [ ] Integrated Streamlit prototype demonstration[cite: 1]

---

## ⚠️ Key Risks & Considerations

* **Pretrained Speech Models:** Access to robust, Quranic-specific ASR and phoneme recognition models[cite: 1].
* **Phoneme Mapping:** Complexities in mapping subtle Tajweed pronunciation rules accurately[cite: 1].
* **False Positive Control:** Minimizing false error detection in student recitations[cite: 1].
