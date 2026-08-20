import os
from typing import List
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict

documents_router = APIRouter(prefix="/api/documents", tags=["Reference Document Library"])

# Locate the files directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES_DIR = os.path.join(BASE_DIR, "..", "Medical-Chatbot", "files")

class DocumentMetadata(BaseModel):
    id: str
    document_name: str
    file_name: str
    organization: str
    total_pages: int
    publication_date: str
    status: str
    description: str

    model_config = ConfigDict(from_attributes=True)

GUIDELINE_CATALOG = [
    DocumentMetadata(
        id="who-hypertension-2021",
        document_name="WHO Guideline — Pharmacological Treatment of Hypertension",
        file_name="file1.pdf",
        organization="World Health Organization (WHO)",
        total_pages=61,
        publication_date="Aug 2021",
        status="Verified Guideline",
        description="Evidence-based global public health guidance on the initiation of pharmacological treatment for hypertension in adults."
    ),
    DocumentMetadata(
        id="nice-hypertension-ng136",
        document_name="NICE Guideline — Hypertension in adults: diagnosis and management (NG136)",
        file_name="file2.pdf",
        organization="National Institute for Health and Care Excellence (NICE)",
        total_pages=52,
        publication_date="Nov 2023",
        status="Verified Guideline",
        description="National clinical guidance for England and Wales on identifying, diagnosing, and treating primary hypertension."
    ),
]


@documents_router.get("", response_model=List[DocumentMetadata], summary="List all indexed clinical guideline documents")
def list_documents():
    """Retrieve catalog of clinical guidelines loaded in the RAG decision support system."""
    return GUIDELINE_CATALOG


@documents_router.get("/{file_name}/view", summary="View PDF in browser")
@documents_router.get("/{file_name}", include_in_schema=False)
def view_pdf(file_name: str):
    """Stream PDF document inline for in-app viewing."""
    file_path = os.path.join(FILES_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guideline PDF '{file_name}' not found."
        )
    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={file_name}"}
    )


@documents_router.get("/{file_name}/download", summary="Download PDF guideline file")
def download_pdf(file_name: str):
    """Download original PDF guideline file."""
    file_path = os.path.join(FILES_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guideline PDF '{file_name}' not found."
        )
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=file_name
    )
