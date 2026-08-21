def validate_user_input(transcript: str) -> tuple[bool, str]:
    """Ensures input string meets safety and structural requirements."""
    if not transcript or not transcript.strip():
        return False, "Input cannot be empty."
    
    cleaned_input = transcript.strip()
    
    if len(cleaned_input) < 2:
        return False, "Input is too short."
        
    if len(cleaned_input) > 1000:
        return False, "Input exceeds maximum length of 1000 characters."
        
    return True, "Valid"