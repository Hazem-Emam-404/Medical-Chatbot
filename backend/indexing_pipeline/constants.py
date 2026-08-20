# file1.pdf (WHO) — main sections only, PRINTED page numbers from the Contents page.
# Offset: printed page 1 = physical page 13 (confirmed: +12 offset)
TOC_FILE1 = [
    ("Front Matter (Acknowledgements, Acronyms, Executive Summary)", 1 - 12),  
    ("1 Introduction", 1),
    ("2 Method for developing the guideline", 3),
    ("3 Recommendations", 7),
    ("4 Special settings", 21),
    ("5 Publication, implementation, evaluation and research gaps", 24),
    ("6 Implementation tools", 26),
    ("References", 30),
    ("Annex 1: List of contributors", 37),
    ("Annex 2. Managing declarations of interest and conflicts of interest", 42),
    ("Annex 3: Treatment outcomes relevant to hypertension", 43),
    ("Annex 4: PICO questions", 44),
]
FILE1_OFFSET = 12  # physical_page = printed_page + 12

# file2.pdf (NICE) — main sections only. Page numbers match the PDF directly, no offset.
TOC_FILE2 = [
    ("Front Matter", 1),
    ("Overview", 4),
    ("Recommendations", 5),
    ("Recommendations for research", 27),
    ("Rationale and impact", 31),
    ("Context", 48),
    ("Finding more information and committee details", 50),
    ("Update information", 51),
]
FILE2_OFFSET = 0  # physical_page = printed_page directly

CHUNK_SIZE = 900
CHUNK_OVERLAP = 150
