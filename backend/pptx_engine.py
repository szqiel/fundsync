import os
from pptx import Presentation
from typing import List, Tuple

def get_text_frames_from_shape(shape) -> list:
    """
    Recursively extracts all text frames from a shape (including tables and group shapes).
    """
    text_frames = []
    
    if shape.has_text_frame:
        text_frames.append(shape.text_frame)
        
    if shape.has_table:
        for row in shape.table.rows:
            for cell in row.cells:
                if cell.text_frame:
                    text_frames.append(cell.text_frame)
                    
    # If it's a group shape, traverse child shapes
    if hasattr(shape, "shapes"):
        for sub_shape in shape.shapes:
            text_frames.extend(get_text_frames_from_shape(sub_shape))
            
    return text_frames

def normalize_text(text: str) -> str:
    """
    Normalizes casing, smart quotes, and collapsing extra whitespace 
    to make text matching extremely robust against minor LLM variations.
    """
    if not text:
        return ""
    normalized = text.lower().strip()
    # Normalize quotes
    normalized = normalized.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    # Collapse multiple whitespaces
    normalized = " ".join(normalized.split())
    return normalized

def replace_text_in_pptx(input_path: str, output_path: str, replacements: dict) -> Tuple[int, int]:
    """
    Ingests a .pptx file, iterates through all shapes recursively, and replaces text.
    First tries run-level replacement to preserve local formatting. If the text is split across runs,
    falls back to paragraph-level replacement.
    If exact matches fail, falls back to normalized paragraph comparison.
    Returns a tuple of (total_replacements_made, total_slides_modified).
    """
    prs = Presentation(input_path)
    replacements_made = 0
    slides_modified = 0

    for slide in prs.slides:
        slide_had_replacement = False
        text_frames = []
        for shape in slide.shapes:
            text_frames.extend(get_text_frames_from_shape(shape))
            
        for text_frame in text_frames:
            for paragraph in text_frame.paragraphs:
                for old_text, new_text in replacements.items():
                    if not old_text.strip():
                        continue
                    
                    # 1. Try exact matching
                    if old_text in paragraph.text:
                        replaced_at_run_level = False
                        for run in paragraph.runs:
                            if old_text in run.text:
                                run.text = run.text.replace(old_text, new_text)
                                replaced_at_run_level = True
                                replacements_made += 1
                                slide_had_replacement = True
                                print(f"[Exact Match - Run] Replaced: '{old_text}' -> '{new_text}'")
                                break
                        
                        if not replaced_at_run_level:
                            paragraph.text = paragraph.text.replace(old_text, new_text)
                            replacements_made += 1
                            slide_had_replacement = True
                            print(f"[Exact Match - Paragraph] Replaced: '{old_text}' -> '{new_text}'")
                            
                    # 2. Try normalized paragraph comparison fallback (full match)
                    elif normalize_text(old_text) == normalize_text(paragraph.text):
                        paragraph.text = new_text
                        replacements_made += 1
                        slide_had_replacement = True
                        print(f"[Normalized Fallback] Replaced paragraph: '{paragraph.text}' -> '{new_text}'")

        if slide_had_replacement:
            slides_modified += 1

    prs.save(output_path)
    return replacements_made, slides_modified

def validate_pptx(file_path: str) -> bool:
    """
    Anti-Corruption Validation: Attempts to re-parse the saved .pptx file.
    Returns True if valid, False if corrupted.
    """
    try:
        Presentation(file_path)
        return True
    except Exception as e:
        print(f"Anti-Corruption check failed for {file_path}: {e}")
        return False

def extract_text_from_pptx(input_path: str) -> List[str]:
    """
    Extracts all unique text paragraphs from the presentation recursively to feed into the AI.
    This preserves full sentences, table contents, and grouped text boxes.
    """
    prs = Presentation(input_path)
    paragraphs = []
    
    for slide in prs.slides:
        text_frames = []
        for shape in slide.shapes:
            text_frames.extend(get_text_frames_from_shape(shape))
            
        for text_frame in text_frames:
            for paragraph in text_frame.paragraphs:
                p_text = paragraph.text.strip()
                # Filter out empty text, slide numbers, or extremely short formatting artifacts
                if p_text and len(p_text) > 3 and p_text not in paragraphs:
                    paragraphs.append(p_text)
            
    return paragraphs
