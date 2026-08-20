import os
import re
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
import sys

# Ensure the root project directory (AI-Hackathon) is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.config import HF_TOKEN

from backend.indexing_pipeline.utils import SECTION_RANGES_BY_FILE, section_for_page, prepare_metadata
from backend.indexing_pipeline.constants import CHUNK_SIZE, CHUNK_OVERLAP

def clean_pdf_text(text: str) -> str:
    # 1. Fix line-break hyphenations
    text = re.sub(r'-\n', '', text)
    # 2. Remove floating page numbers
    text = re.sub(r'\n\s*\d{1,4}\s*\n', '\n', text)
    text = re.sub(r'Page \d+ of\s*\n\s*\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^\s*(i{1,3}|iv|v|vi{0,3}|ix|x{1,3})\s*$', '', text, flags=re.IGNORECASE | re.MULTILINE)

    boilerplate_patterns = [
        r'Hypertension in adults: diagnosis and management \(NG136\)',
        r'GUIDELINE FOR THE PHARMACOLOGICAL TREATMENT OF HYPERTENSION IN ADULTS',
        r'NICE guideline.*',
        r'© NICE \d{4}[\s\S]{0,150}?notice-of-rig[a-z]*\)?',
        r'© World Health Organization \d{4}.*',
        r'World Health Organization;? ?\d{0,4}\.?$',
        r'ISBN 978-92-4-\d+-\d+.*',
        r'Some rights reserved.*',
        r'Creative Commons.*',
        r'creativecommons\.org.*',
        r'All rights reserved\.?$',
    ]
    
    for pattern in boilerplate_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.MULTILINE)

    # 3. Collapse multiple spaces and tabs
    text = re.sub(r'[ \t]+', ' ', text)
    # 4. Collapse 3 or more newlines into just 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def run_indexing_pipeline():
    print("1. Data Ingestion...")
    docs = []
    
    # Resolving files directory (assuming files are still in Medical-Chatbot/files)
    # If moved to backend, please adjust FILES_DIR
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    FILES_DIR = os.path.join(BASE_DIR,"indexing_pipeline", "files")
    
    if not os.path.exists(FILES_DIR):
        print(f"Error: Could not find files directory at {FILES_DIR}")
        return

    for file in os.listdir(FILES_DIR):
        if file.endswith(".pdf"):
            loader = PyMuPDFLoader(os.path.join(FILES_DIR, file))
            docs.extend(loader.load())
    
    print(f"Loaded {len(docs)} pages.")

    print("2. Updating Metadata...")
    for doc in docs:
        doc.metadata["page"] = doc.metadata["page"] + 1
        source_path = doc.metadata.get("source", "")
        doc.metadata["file_name"] = os.path.basename(source_path)

        section_ranges = SECTION_RANGES_BY_FILE.get(doc.metadata["file_name"])
        if section_ranges:
            doc.metadata["section_title"] = section_for_page(doc.metadata["page"], section_ranges)
        else:
            doc.metadata["section_title"] = "Unknown"

    print("3. Cleaning Docs...")
    cleaned_docs = []
    for doc in docs:
        file_name = doc.metadata.get("file_name", "")
        page_num = doc.metadata.get("page", 0)

        # Skip preface pages
        if file_name == "file1.pdf" and page_num <= 8:
            continue
        if file_name == "file2.pdf" and page_num <= 3:
            continue

        new_page_content = clean_pdf_text(doc.page_content)
        if len(new_page_content.strip()) == 0:
            continue

        doc.page_content = new_page_content
        cleaned_docs.append(doc)
    
    print(f"{len(cleaned_docs)} pages cleaned.")

    print("4. Splitting & Chunking...")
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=CHUNK_SIZE,        
        chunk_overlap=CHUNK_OVERLAP,      
        separators=["\n\n", "\n", ". ", " ", ""], 
    )

    splitted_docs = splitter.split_documents(cleaned_docs)
    all_chunks = prepare_metadata(splitted_docs)
    print(f"Generated {len(all_chunks)} chunks.")

    print("5. Vectorization and Saving to Chroma DB...")
    os.environ["HF_TOKEN"] = HF_TOKEN
    hf_embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")

    DB_PATH = os.path.join(BASE_DIR, "chroma_db")
    vectorstore = Chroma.from_documents(all_chunks, hf_embeddings, persist_directory=DB_PATH)
    print(f"Success! Collection created at {DB_PATH} with {vectorstore._collection.count()} chunks.")

if __name__ == "__main__":
    run_indexing_pipeline()
