import os
from pptx import Presentation

def replace_text_in_pptx(input_path: str, output_path: str, replacements: dict) -> int:
    """
    Ingests a .pptx file, iterates through all shapes, and replaces text based on the replacements dict.
    Returns the total number of text replacements made.
    """
    prs = Presentation(input_path)
    replacements_made = 0

    for slide in prs.slides:
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            
            for paragraph in shape.text_frame.paragraphs:
                for run in paragraph.runs:
                    for old_text, new_text in replacements.items():
                        if old_text in run.text:
                            run.text = run.text.replace(old_text, new_text)
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
