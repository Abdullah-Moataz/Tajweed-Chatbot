# cd "$HOME\Desktop\tajweed-rag-backend"
# .\.venv\Scripts\python.exe -m uvicorn app:app --reload

import os
from pathlib import Path
from functools import lru_cache
import traceback

from pinecone import Pinecone, EmbedQuery
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Tajweed RAG API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://tajweed-assistant.vercel.app"], allow_methods=["GET", "POST"], allow_headers=["*"])

JAIS_MODEL = "IFM/Jais-3-MoVA-36B-A4B"
SYSTEM_PROMPT = """أنت مساعد تعليمي ودود ومتخصص في علم التجويد، وهدفك مساعدة الطلاب على فهم أحكام التجويد بطريقة سهلة ومشوقة.
1. أجب عن السؤال المطروح مباشرة دون إضافة معلومات غير مطلوبة.
2. اعتمد حصرياً على النصوص المرجعية المسترجعة.
3. لا تضف أحكاماً أو استثناءات إلا إذا كانت ضرورية للإجابة.
4. حافظ على كتابة الآيات القرآنية وتشكيلها كما وردت في المصدر.
5. لا تغير الأمثلة القرآنية أو تعيد تشكيلها من عندك.
6. إذا كان السؤال يطلب حالات أو شروطاً، فاذكرها بشكل منظم.
7. لا تذكر أرقام الصفحات.
8. إذا لم تتوفر معلومات كافية، فصرح بذلك.
9. استخدم لغة عربية واضحة ومبسطة تناسب مستوى الطالب.
10. استخدم أسلوباً لطيفاً ومشجعاً، واظهر الاهتمام بتقدم الطالب.
11. قدم عبارات تشجيعية قصيرة عند الحاجة، دون مبالغة أو تكرار.
12. إذا كان السؤال خارج نطاق علم التجويد، فلا تجب عنه، واستخدم الرد التالي حرفياً دون أي تعديل:
"يسعدني سؤالك! 🌷 أنا هنا فقط لمساعدتك في تعلم أحكام التجويد. يمكنك سؤالي عن أي قاعدة تجويدية، وسأساعدك بكل سرور."
13. إذا كان السؤال تحية أو شكراً، فرد بلطف واختصار دون الحاجة إلى معلومات مرجعية."""

class Question(BaseModel):
    question: str = Field(min_length=1, max_length=1500)
    level: str | None = None

@lru_cache(maxsize=1)
def rag_resources():
    pc = Pinecone(
        api_key=os.environ["PINECONE_API_KEY"]
    )
    return pc.index(os.environ["PINECONE_INDEX_NAME"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/ask")
def ask(payload: Question):
    if not os.getenv("JAIS_API_KEY"):
        raise HTTPException(status_code=500, detail="JAIS_API_KEY is missing")
    try:
        index = rag_resources()

        results = index.documents.search(
            namespace="tajweed",
            top_k=5,
            score_by=[
                EmbedQuery(
                    field="chunk_text",
                    query=payload.question
                )
            ],
            include_fields=["chunk_text", "level", "topic"],
            filter={"level": {"$eq": int(payload.level)}}
            if payload.level is not None else None
        )

        passages = [
            f"المستوى: {doc.level}\n"
            f"الموضوع: {doc.topic}\n"
            f"النص: {doc.chunk_text}"
            for doc in results.matches
        ]

        context = "\n\n---\n\n".join(passages)
        client = OpenAI(api_key=os.environ["JAIS_API_KEY"], base_url="https://api.ifm.ai/v1")
        response = client.chat.completions.create(
            model=JAIS_MODEL,
            messages=[{"role": "system", "content": SYSTEM_PROMPT},
                      {"role": "user", "content": f"السؤال: {payload.question}\n\nالنصوص المرجعية:\n{context}"}],
            temperature=0.2)
        return {"answer": response.choices[0].message.content}
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"RAG request failed: {type(exc).__name__}"
        ) from exc