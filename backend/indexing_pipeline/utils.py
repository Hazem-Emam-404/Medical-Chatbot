from langchain_core.documents import Document
from .constants import TOC_FILE1, FILE1_OFFSET, TOC_FILE2, FILE2_OFFSET

def prepare_metadata(splitted_docs):
    all_chunks = []
    for idx, chunk in enumerate(splitted_docs):
        source_file = chunk.metadata.get("source", "unknown")
        file_name = chunk.metadata.get("file_name", "unknown")

        metadata ={
            "document_name": file_name,
            "page_number": chunk.metadata.get("page", 0),
            "chunk_id": f"{file_name}_ch{idx+1:04d}",
            "source_url": source_file,
            "section": chunk.metadata.get("section_title", "Unknown"),
        }
        all_chunks.append(Document(page_content=chunk.page_content, metadata=metadata))
    return all_chunks


def build_section_ranges(toc, offset):
    """toc entries use PRINTED page numbers; this converts them to PHYSICAL page ranges."""
    ranges = []
    for i, (title, printed_page) in enumerate(toc):
        physical_start = printed_page + offset
        physical_end = toc[i + 1][1] + offset - 1 if i + 1 < len(toc) else 10_000
        ranges.append({"title": title, "start_page": physical_start, "end_page": physical_end})
    return ranges

def section_for_page(physical_page, section_ranges):
    for sec in section_ranges:
        if sec["start_page"] <= physical_page <= sec["end_page"]:
            return sec["title"]
    return "Unknown / No heading yet"

SECTION_RANGES_BY_FILE = {
    "file1.pdf": build_section_ranges(TOC_FILE1, FILE1_OFFSET),
    "file2.pdf": build_section_ranges(TOC_FILE2, FILE2_OFFSET),
}
