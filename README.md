# Tajweed AI Tutor: RAG-Based Education & Audio Recitation Feedback 

A Streamlit-based application designed to assist students in learning Tajweed rules through an AI-powered Arabic Q&A chatbot (built using Retrieval-Augmented Generation) and automated recitation feedback .

---

## 📌 Project Overview

Students learning Quranic Tajweed often face challenges in accessing clear explanations and receiving timely feedback on pronunciation . The **Tajweed AI Tutor** addresses this gap by combining an Arabic Tajweed knowledge base indexed in a vector database with phoneme-level audio analysis .

> **Disclaimer:** This project is intended as an interactive educational assistant and study aid, not a replacement for a qualified Quran/Tajweed teacher .

---

## ✨ Key Features

* **Arabic Tajweed Q&A Chatbot:** Answers student questions using Retrieval-Augmented Generation (RAG) grounded in verified Arabic Tajweed textbooks with inline citations .
* **Audio Recitation Feedback (Planned):** Allows users to record or upload recitations (focusing initially on *Juz Amma*) to identify potential Tajweed errors .
* **Reference Audio Playback:** Plays verified Quranic recitation samples for comparison .
* **Interactive Makharij Visualizer:** Features an interactive 2D diagram of articulation points (*Makharij al-Huruf*) with clickable details .

---

### 1. Knowledge Base & RAG Pipeline
1. **Source Extraction:** Extracts Arabic text from authoritative Tajweed textbooks using **Baseer OCR** .
2. **Structuring:** Cleans diacritics/glyphs and organizes text into UTF-8 Markdown while preserving page references .
3. **Vector Indexing:** Chunks text and generates multilingual embeddings stored in a vector database .
4. **LLM Generation:** Retrieves relevant passages to generate source-grounded Arabic responses with citations .

### 2. Audio Recitation Pipeline (Planned)
1. **Input:** User selects an Ayah from *Juz Amma* and uploads/records their recitation .
2. **Phoneme Recognition:** Recognizes Quranic phonemes using **Zipformer** .
3. **Forced Alignment:** Applies Montreal Forced Aligner (**MFA**) for precise timestamp alignment .
4. **Rule Evaluation:** Compares recognized sounds and timings against expected Tajweed rules to explain suspected errors .

---

## 🛠️ Tech Stack

* **Frontend / UI:** Python, Streamlit 
* **OCR & Text Processing:** Baseer OCR (benchmarked against PDF parsers, Tesseract, EasyOCR, Kraken, and Gemini Vision) 
* **Embeddings & Vector Search:** Multilingual Embedding Models, Vector Database 
* **Speech Processing:** Zipformer (Quranic Phoneme Recognition), Montreal Forced Aligner (MFA) 

---

## 📊 Current Status & Data Challenges

### Completed Milestones
* Designed end-to-end two-part architecture (Arabic RAG + Audio Analysis) .
* Benchmarked multiple Arabic OCR solutions on sample pages and selected **Baseer OCR** .
* Initiated text extraction and Markdown cleaning with retained page references .

### Addressed Technical Challenges
* **Corrupted PDF Text:** Solved Arabic font encoding errors caused by native PDF parsers .
* **Diacritics & Layout:** Handled Arabic vocalization marks (*Tashkeel*), Quranic glyphs, right-to-left layout shifts, and footnotes .

---

## 🗺️ Project Roadmap

- [x] Architecture design & workflow specification 
- [x] OCR benchmarking & engine selection (Baseer OCR) 
- [ ] Arabic Tajweed textbook extraction & verification 
- [ ] Vector database chunking & embedding generation 
- [ ] RAG chatbot implementation with citation evaluation 
- [ ] Audio feedback pilot on *Juz Amma* recitations 
- [ ] Integrated Streamlit prototype demonstration 

---

## ⚠️ Key Risks & Considerations

* **Pretrained Speech Models:** Access to robust, Quranic-specific ASR and phoneme recognition models .
* **Phoneme Mapping:** Complexities in mapping subtle Tajweed pronunciation rules accurately .
* **False Positive Control:** Minimizing false error detection in student recitations .
