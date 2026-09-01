# ─── UPDATED REPUTATION NAME MATCHING CODE ──────────────────────────────
# File: modules/module4_reputation.py

import asyncio
import re
from dataforseo_client import dataforseo_post

def clean_name_tokens(text: str) -> set:
    text = text.lower().strip()
    for prefix in ['https://', 'http://', 'www.']:
        if text.startswith(prefix):
            text = text[len(prefix):]
    text = re.sub(r'\.(com|ae|co|io|net|org|uk|us|dev|tech|ca|au|in|pk|eu|de|fr)\b', '', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    suffixes = {'inc', 'llc', 'ltd', 'co', 'corp', 'corporation', 'pvt', 'private', 'limited'}
    generic_descriptors = {
        'software', 'development', 'services', 'solutions', 'technologies', 'tech',
        'systems', 'consulting', 'agency', 'group', 'digital', 'company', 'business',
        'clinic', 'center', 'centre'
    }
    words = {w for w in text.split() if w not in suffixes and len(w) > 1}
    specific = words - generic_descriptors
    return specific if specific else words

def is_matching_business(target_name: str, profile_title: str) -> bool:
    target_clean = re.sub(r'[^\w]', '', target_name.lower())
    for prefix in ['https', 'http', 'www']:
        if target_clean.startswith(prefix):
            target_clean = target_clean[len(prefix):]
    target_clean = re.sub(r'(com|ae|co|io|net|org|uk|us|dev|tech|ca|au|in|pk|eu|de|fr)$', '', target_clean)

    profile_clean = re.sub(r'[^\w]', '', profile_title.lower())
    
    if target_clean and (target_clean in profile_clean or profile_clean in target_clean):
        return True
        
    target_words = clean_name_tokens(target_name)
    profile_words = clean_name_tokens(profile_title)
    
    if not target_words or not profile_words:
        return True
        
    if len(profile_words) >= 1 and all(pw in target_clean for pw in profile_words):
        return True

    if len(target_words) >= 1 and all(tw in profile_clean for tw in target_words):
        return True
        
    intersection = target_words.intersection(profile_words)
    union = target_words.union(profile_words)
    if target_words.issubset(profile_words) or profile_words.issubset(target_words):
        return True
    jaccard = len(intersection) / len(union) if union else 0
    return jaccard >= 0.30