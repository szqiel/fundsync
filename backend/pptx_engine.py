import os
from pptx import Presentation
from typing import List

def replace_text_in_pptx(input_path: str, output_path: str, replacements: dict) -> int:
    """
    Ingests a .pptx file, iterates through all shapes, and replaces text based on the replacements dict.
    First tries run-level replacement to preserve local formatting. If the text is split across runs,
    falls back to paragraph-level replacement.
    Returns the total number of text replacements made.
    """
    prs = Presentation(input_path)
    replacements_made = 0

    for slide in prs.slides:
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            
            for paragraph in shape.text_frame.paragraphs:
                for old_text, new_text in replacements.items():
                    if not old_text.strip():
                        continue
                    
                    if old_text in paragraph.text:
                        # 1. Try run-level replacement first (to keep bold, italic, size, etc.)
                        replaced_at_run_level = False
                        for run in paragraph.runs:
                            if old_text in run.text:
                                run.text = run.text.replace(old_text, new_text)
                                replaced_at_run_level = True
                                replacements_made += 1
                                break
                        
                        # 2. Fall back to paragraph-level replacement if the target text was split across runs
                        if not replaced_at_run_level:
                            paragraph.text = paragraph.text.replace(old_text, new_text)
                            replacements_made += 1

    prs.save(output_path)
    return replacements_made

def validate_pptx(file_path: str) -> bool:
    """
    Anti-Corruption Validation: Attempts to re-parse the saved .pptx file.
    Returns True if valid, False if corrupted.
    """
    try:
        # If python-pptx can open it, the XML structure is valid
        Presentation(file_path)
        return True
    except Exception as e:
        print(f"Anti-Corruption check failed for {file_path}: {e}")
        return False

def extract_text_from_pptx(input_path: str) -> List[str]:
    """
    Extracts all unique text paragraphs from the presentation to feed into the AI.
    This preserves full sentences and placeholders.
    """
    prs = Presentation(input_path)
    paragraphs = []
    
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    p_text = paragraph.text.strip()
                    # Filter out empty text, slide numbers, or extremely short formatting artifacts
                    if p_text and len(p_text) > 3 and p_text not in paragraphs:
                        paragraphs.append(p_text)
            
    return paragraphs
