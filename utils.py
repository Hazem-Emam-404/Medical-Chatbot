from langchain_core.documents import Document

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
        }
        all_chunks.append(Document(page_content=chunk.page_content, metadata = metadata))
    return all_chunks