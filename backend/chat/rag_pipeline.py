import os
import json
import logging
from typing import List, Dict, Optional, Any
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from backend.config import GROQ_API_KEY, HF_TOKEN
from backend.chat.utils import (
    rerank,
    retrieve_topk,
    is_conversational_or_greeting,
    classify_input_risk_hybrid,
    build_prompt,
)

logger = logging.getLogger("rag_pipeline")

# BASE_DIR is 'backend' folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")

K = 3
POOL_SIZE = 15

_vectorstore = None
_llm = None

def get_vectorstore():
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore
        
    if HF_TOKEN:
        os.environ["HF_TOKEN"] = HF_TOKEN
    hf_embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
    
    _vectorstore = Chroma(
        persist_directory=DB_PATH,
        embedding_function=hf_embeddings
    )
    return _vectorstore


def get_llm():
    global _llm
    if _llm is not None:
        return _llm
    _llm = ChatGroq(model="openai/gpt-oss-120b", groq_api_key=GROQ_API_KEY, temperature=0)
    return _llm


GROUNDING_SYSTEM_PROMPT = '''You are an evidence-grounded clinical decision-support assistant named ClinicianMind AI.

SAFETY AND GROUNDING RULES:
1. For clinical questions: Use ONLY the retrieved evidence supplied in the user message. Do not use outside medical knowledge or invent missing facts, thresholds, diagnoses, or treatments.
2. CONVERSATIONAL, GREETING & PERSONALIZED CLINICIAN PROFILE RULE:
   - If a Registered Clinician Profile Name is provided in the prompt (e.g. "Registered Clinician Profile: Name:  Sarah Connor"), address and greet them personally by name (e.g. "Hello Sarah," or "Welcome Connor,") when greeting or welcoming them.
   - If the user asks about their personal information, name, role, previous statements, or details in the conversation history or profile:
     - State and recall their information normally, accurately, and politely.
     - Set status to "answered", confidence to "High", input_risk to null, supporting_evidence to [], and missing_information to [].
   - If no clinician name is provided (Guest Mode), greet politely as a clinician without assuming a name.
   - For all greetings, pleasantries, and general questions about you (e.g. "hello", "hi", "how are you", "who are you", "what can you do", "thanks"):
     - Respond cordially, politely, and normally as ClinicianMind AI, an evidence-based clinical decision support assistant grounded in official WHO and NICE guidelines.
     - Set status to "answered", confidence to "High", input_risk to null, supporting_evidence to [], and missing_information to [].
3. Do not provide a patient-specific diagnosis, prescription, dosage, or treatment selection.
4. For clinical answers: Every factual claim in the recommendation and supporting evidence must use one or more exact citations copied from the supplied evidence. Citations MUST include Document, Page, and Chunk ID.
5. If a medical/clinical question has missing, weak, unrelated, or insufficient evidence in the retrieved text, set status to "insufficient_evidence".
6. If the request is patient-specific or asks for diagnosis, dosage, or personalized treatment, set status to "safety_refusal".
7. Confidence describes evidence quality, not the model's personal certainty.
8. Return valid JSON only. No Markdown fences or text outside the JSON.
9. If status is "insufficient_evidence", leave the supporting_evidence array completely empty.
10. FOLLOW-UP SUGGESTIONS RULE:
    - In "follow_up_suggestions": Generate 2 to 3 concise follow-up questions derived from the GIVEN RETRIEVED CONTEXT and PAST CONVERSATION MESSAGES.
    - STRICT PROHIBITION: NEVER suggest questions that you are prohibited from answering (e.g. DO NOT suggest questions asking for patient-specific diagnosis, personalized prescriptions, individual dosages, or treatment plans for a specific patient).
    - Only suggest questions regarding guideline thresholds, first-line drug classes, cardiovascular risk assessment, and monitoring criteria that can be answered directly by the official guidelines.
11. FORMATTING RULE: Format "recommendation" cleanly using standard Markdown with structured paragraphs, bold category headings, and bullet points (\n\n- ) for clarity and readability.

Return exactly this structure:
{
  "status": "answered | insufficient_evidence | safety_refusal",
  "input_risk": null,
  "recommendation": "friendly response or short evidence-grounded answer or refusal",
  "supporting_evidence": [
    {"claim": "one supported claim", "citations": ["[Document_name | Page N | Section N |Chunk ID]"]}
  ],
  "confidence": "High | Medium | Low | Insufficient Evidence | safety_refusal",
  "missing_information": ["Explain what is missing to answer the question fully, or write 'A qualified clinician must assess the individual case' for safety refusals. Leave empty if fully answered or greeting."],
  "follow_up_suggestions": [
    "Relevant clinical follow-up question 1",
    "Relevant clinical follow-up question 2"
  ],
  "safety_note": "Educational information only; not a diagnosis or medical advice."
}'''


def generate_grounded_answer(
    question: str, 
    results=None, 
    k: int = K, 
    chat_history: Optional[List[Dict[str, Any]]] = None,
    user_name: Optional[str] = None
):
    """
    Generate structured, grounded clinical answer using Re-ranked retrieved chunks and LLM.
    """
    vectorstore = get_vectorstore()
    
    # If results not pre-computed, run CrossEncoder re-ranking
    if results is None:
        results = rerank(question, k_final=k, pool_size=POOL_SIZE, vs=vectorstore)
        
    prompt = build_prompt(
        question=question, 
        retrieved_chunks=results, 
        system_prompt=GROUNDING_SYSTEM_PROMPT, 
        chat_history=chat_history,
        user_name=user_name
    )
    
    llm = get_llm()
    response = llm.invoke(prompt)
    content = response.content.strip()
    
    if content.startswith("```json"):
        content = content[7:-3].strip()
    elif content.startswith("```"):
        content = content[3:-3].strip()
            
    try:
        answer = json.loads(content)
        if isinstance(answer, dict):
            answer.setdefault("input_risk", None)
    except json.JSONDecodeError:
        answer = {"error": "Invalid JSON format generated", "raw": content, "input_risk": None}
        
    return answer, prompt, results


def generate_with_refusal_check(
    question: str, 
    chat_history: Optional[List[Dict[str, Any]]] = None,
    distance_threshold: float = 1.2,
    user_name: Optional[str] = None
):
    """
    Full clinical decision pipeline:
    1. Input Risk Classification (Critical, High, Medium, Low)
    2. Conversational / Greeting Pass-Through (with personalized clinician name)
    3. Re-ranked Retrieval via CrossEncoder (ms-marco-MiniLM-L-6-v2)
    4. Distance & Evidence Refusal Checking
    5. Grounded Generation
    """
    risk_assessment = classify_input_risk_hybrid(question)

    if risk_assessment["level"] == "Critical":
        return {
            "status": "safety_refusal",
            "input_risk": "Critical",
            "recommendation": "If you are experiencing a medical emergency, please seek immediate medical attention or call emergency services. I cannot process adversarial or emergency requests.",
            "supporting_evidence": [],
            "confidence": "safety_refusal",
            "missing_information": ["Emergency or Adversarial request detected."],
            "follow_up_suggestions": [],
            "safety_note": "Immediate medical attention may be required."
        }
        
    if risk_assessment["level"] == "High":
        return {
            "status": "safety_refusal",
            "input_risk": "High",
            "recommendation": "This appears to be a patient-specific diagnosis or dosage request. As an AI, I cannot prescribe medication or diagnose conditions. Please consult a qualified clinician.",
            "supporting_evidence": [],
            "confidence": "safety_refusal",
            "missing_information": ["Patient-specific diagnosis or dosage request detected."],
            "follow_up_suggestions": [],
            "safety_note": "Educational information only; not a diagnosis or medical advice."
        }
        
    if risk_assessment["level"] == "Medium":
        return {
            "status": "insufficient_evidence",
            "input_risk": "Medium",
            "recommendation": "Your question is either ambiguous or outside the scope of my clinical guidelines. Could you please clarify your question?",
            "supporting_evidence": [],
            "confidence": "insufficient_evidence",
            "missing_information": ["Ambiguous or out-of-domain request detected."],
            "follow_up_suggestions": [],
            "safety_note": "Educational information only; not a diagnosis or medical advice."
        }

    # If greeting or conversational, pass directly to LLM without insufficient evidence block
    if is_conversational_or_greeting(question):
        answer, _, _ = generate_grounded_answer(question, results=[], chat_history=chat_history, user_name=user_name)
        if isinstance(answer, dict):
            answer["input_risk"] = None
        return answer

    vectorstore = get_vectorstore()
    
    # 1. Retrieve initial candidate pool to evaluate distance
    raw_candidates = retrieve_topk(question, k=POOL_SIZE, vs=vectorstore)
    top_distance = raw_candidates[0][1] if raw_candidates else 999
    
    # 2. Apply CrossEncoder Re-ranking on candidates
    reranked_results = rerank(question, k_final=K, pool_size=POOL_SIZE, vs=vectorstore)

    # 3. If evidence is too weak, trigger insufficient evidence refusal
    if top_distance > distance_threshold or not reranked_results:
        return {
            "status": "insufficient_evidence",
            "input_risk": None,
            "recommendation": "The retrieved guideline does not provide sufficient evidence to answer this question reliably.",
            "supporting_evidence": [],
            "confidence": "Insufficient Evidence",
            "missing_information": [
                "No retrieved chunk reached the minimum evidence quality needed to answer this question."
            ],
            "follow_up_suggestions": [],
            "safety_note": "Educational information only; not a diagnosis or medical advice."
        }
        
    answer, _, _ = generate_grounded_answer(question, results=reranked_results, chat_history=chat_history, user_name=user_name)
    if isinstance(answer, dict):
        answer["input_risk"] = None
    return answer