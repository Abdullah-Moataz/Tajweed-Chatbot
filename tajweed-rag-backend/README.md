# Tajweed RAG backend

Uses the same Chroma collection, E5 embedding model, Jais API, and RAG prompt as the Colab notebook.

1. Copy your Google Drive `chroma_db` directory into this folder (so it contains `chroma.sqlite3` and its index directories).
2. Open PowerShell in this folder.
3. `py -m venv .venv`
4. `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
5. `$env:JAIS_API_KEY="YOUR_KEY"` (do not commit the key)
6. `.\.venv\Scripts\python.exe -m uvicorn app:app --reload`
7. Visit http://127.0.0.1:8000/docs, open POST /ask, click Try it out, and submit `{"question":"ما هو المد الطبيعي؟"}`.

The first request downloads the embedding model and may take some time. The `/health` route does not load the embedding model. This app has not been run against your Chroma database, because the database and API key are not available here.

The CORS allowlist only includes the local Vite development website. Update it for your production domain before deployment. Do not expose the local development API directly to the public internet without rate limiting and appropriate access controls.
