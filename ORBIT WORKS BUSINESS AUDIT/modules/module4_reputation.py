import asyncio
import re
from dataforseo_client import dataforseo_post

COUNTRY_MAP = {
    "AF": "Afghanistan", "AX": "Aland Islands", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa", "AD": "Andorra",
    "AO": "Angola", "AI": "Anguilla", "AQ": "Antarctica", "AG": "Antigua and Barbuda", "AR": "Argentina", "AM": "Armenia",
    "AW": "Aruba", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh",
    "BB": "Barbados", "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BM": "Bermuda", "BT": "Bhutan",
    "BO": "Bolivia", "BQ": "Bonaire, Sint Eustatius and Saba", "BA": "Bosnia and Herzegovina", "BW": "Botswana", "BV": "Bouvet Island",
    "BR": "Brazil", "IO": "British Indian Ocean Territory", "BN": "Brunei Darussalam", "BG": "Bulgaria", "BF": "Burkina Faso",
    "BI": "Burundi", "CV": "Cabo Verde", "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "KY": "Cayman Islands",
    "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CX": "Christmas Island", "CC": "Cocos (Keeling) Islands",
    "CO": "Colombia", "KM": "Comoros", "CD": "Congo, Democratic Republic of the", "CG": "Congo", "CK": "Cook Islands",
    "CR": "Costa Rica", "CI": "Cote d'Ivoire", "HR": "Croatia", "CU": "Cuba", "CW": "Curaçao", "CY": "Cyprus",
    "CZ": "Czechia", "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador",
    "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "SZ": "Eswatini",
    "ET": "Ethiopia", "FK": "Falkland Islands (Malvinas)", "FO": "Faroe Islands", "FJ": "Fiji", "FI": "Finland", "FR": "France",
    "GF": "French Guiana", "PF": "French Polynesia", "TF": "French Southern Territories", "GA": "Gabon", "GM": "Gambia",
    "GE": "Georgia", "DE": "Germany", "GH": "Ghana", "GI": "Gibraltar", "GR": "Greece", "GL": "Greenland", "GD": "Grenada",
    "GP": "Guadeloupe", "GU": "Guam", "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau",
    "GY": "Guyana", "HT": "Haiti", "HM": "Heard Island and McDonald Islands", "VA": "Holy See", "HN": "Honduras",
    "HK": "Hong Kong", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq",
    "IE": "Ireland", "IM": "Isle of Man", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JE": "Jersey",
    "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "KP": "Korea, Democratic People's Republic of",
    "KR": "Korea, Republic of", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Lao People's Democratic Republic",
    "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein",
    "LT": "Lithuania", "LU": "Luxembourg", "MO": "Macao", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia",
    "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MQ": "Martinique", "MR": "Mauritania",
    "MU": "Mauritius", "YT": "Mayotte", "MX": "Mexico", "FM": "Micronesia", "MD": "Moldova", "MC": "Monaco",
    "MN": "Mongolia", "ME": "Montenegro", "MS": "Montserrat", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar",
    "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands", "NC": "New Caledonia", "NZ": "New Zealand",
    "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NU": "Niue", "NF": "Norfolk Island", "MP": "Northern Mariana Islands",
    "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PS": "Palestine, State of", "PA": "Panama",
    "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PN": "Pitcairn", "PL": "Poland",
    "PT": "Portugal", "PR": "Puerto Rico", "QA": "Qatar", "RE": "Reunion", "RO": "Romania", "RU": "Russian Federation",
    "RW": "Rwanda", "BL": "Saint Barthélemy", "SH": "Saint Helena, Ascension and Tristan da Cunha", "KN": "Saint Kitts and Nevis",
    "LC": "Saint Lucia", "MF": "Saint Martin (French part)", "PM": "Saint Pierre and Miquelon", "VC": "Saint Vincent and the Grenadines",
    "WS": "Samoa", "SM": "San Marino", "ST": "Sao Tome and Principe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia",
    "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SX": "Sint Maarten (Dutch part)", "SK": "Slovakia",
    "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "GS": "South Georgia and the South Sandwich Islands",
    "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan", "SR": "Suriname", "SJ": "Svalbard and Jan Mayen",
    "SE": "Sweden", "CH": "Switzerland", "SY": "Syrian Arab Republic", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania",
    "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinidad and Tobago",
    "TN": "Tunisia", "TR": "Turkey", "TM": "Turkmenistan", "TC": "Turks and Caicos Islands", "TV": "Tuvalu", "UG": "Uganda",
    "UA": "Ukraine", "AE": "United Arab Emirates", "UAE": "United Arab Emirates", "U.A.E.": "United Arab Emirates",
    "GB": "United Kingdom", "UK": "United Kingdom", "U.K.": "United Kingdom", "ENGLAND": "United Kingdom",
    "US": "United States", "USA": "United States", "U.S.A.": "United States", "AMERICA": "United States",
    "SA": "Saudi Arabia", "KSA": "Saudi Arabia", "K.S.A.": "Saudi Arabia",
    "UM": "United States Minor Outlying Islands", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VE": "Venezuela",
    "VN": "Viet Nam", "VG": "Virgin Islands (British)", "VI": "Virgin Islands (U.S.)", "WF": "Wallis and Futuna",
    "EH": "Western Sahara", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"
}

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

async def analyze_reputation(business_name: str, city: str, country: str = "United States", url: str = "") -> dict:
    """
    Module 4: Reputation (10% weight)
    Calls DataForSEO Maps API with the business name and city.
    """
    # Map country code if a 2-letter code was provided
    country_clean = (country or "").strip().upper()
    full_country_name = COUNTRY_MAP.get(country_clean, country)
    
    # If country is blank, infer from domain TLD in business_name or url
    if not full_country_name and not city:
        TLD_MAP = {
            ".ae": "United Arab Emirates", ".ca": "Canada", ".uk": "United Kingdom",
            ".au": "Australia", ".in": "India", ".pk": "Pakistan", ".de": "Germany",
            ".fr": "France", ".es": "Spain", ".it": "Italy", ".nl": "Netherlands",
            ".sg": "Singapore", ".nz": "New Zealand", ".za": "South Africa",
            ".mx": "Mexico", ".br": "Brazil", ".us": "United States"
        }
        combined_text = (business_name + " " + url).lower()
        for tld, mapped_c in TLD_MAP.items():
            if tld in combined_text:
                full_country_name = mapped_c
                break
    
    # Establish search payloads to try in sequence
    payloads = []
    if full_country_name:
        payloads.append({"keyword": f"{business_name} {city}".strip(), "location_name": full_country_name, "language_code": "en"})
    if city:
        payloads.append({"keyword": f"{business_name} {city}".strip(), "location_name": city, "language_code": "en"})
    payloads.append({"keyword": f"{business_name} {city}".strip(), "language_code": "en"})

    star_rating = 0.0
    review_count = 0
    profile_completeness = 0
    sentiment_summary = "No profile found."

    for payload in payloads:
        try:
            response = await dataforseo_post("serp/google/maps/live/advanced", [payload])
            tasks = response.get("tasks", [])
            if tasks and tasks[0].get("result"):
                items = tasks[0]["result"][0].get("items", [])
                if items:
                    # Find the first item that is a close name match
                    matched_profile = None
                    for item in items:
                        title = item.get("title", "")
                        if is_matching_business(business_name, title):
                            matched_profile = item
                            break
                            
                    if matched_profile:
                        profile = matched_profile
                        star_rating = float(profile.get("rating", {}).get("value", 0))
                        review_count = int(profile.get("rating", {}).get("votes_count", 0))
                        
                        # Estimate completeness based on available fields in the maps response
                        fields = ["address_info", "phone", "work_hours", "snippet", "category", "url", "main_image"]
                        filled = sum(1 for f in fields if profile.get(f))
                        profile_completeness = int((filled / len(fields)) * 100)
                        
                        if star_rating > 4.0:
                            sentiment_summary = "Strong positive sentiment and highly rated by customers."
                        elif star_rating > 3.0:
                            sentiment_summary = "Average customer sentiment, some improvements needed."
                        elif star_rating > 0:
                            sentiment_summary = "Poor sentiment, urgent reputation management required."
                        else:
                            sentiment_summary = "No ratings available yet."
                            
                        reputation_score = int((star_rating / 5) * 50 + (min(review_count, 100) / 100) * 30 + (profile_completeness / 100) * 20)
                        
                        top_2_gaps = []
                        if profile_completeness < 100:
                            top_2_gaps.append(f"Profile completeness is at {profile_completeness}%, missing key information fields.")
                        if review_count < 10:
                            top_2_gaps.append(f"Review count is low ({review_count}), which damages local trust.")
                        if star_rating < 4.0 and star_rating > 0:
                            top_2_gaps.append(f"Star rating is {star_rating}, below the ideal 4.0+ threshold.")
                            
                        if not top_2_gaps:
                            top_2_gaps = ["No major reputation gaps detected."]
                            
                        return {
                            "reputation_score": reputation_score,
                            "star_rating": star_rating,
                            "review_count": review_count,
                            "profile_completeness": profile_completeness,
                            "sentiment_summary": sentiment_summary,
                            "top_2_gaps": top_2_gaps[:2],
                            "data_source": "live"
                        }
        except Exception as e:
            print(f"Reputation search failed for payload {payload}: {repr(e)}")

    # Default fallback when all searches return nothing
    reputation_score = int((star_rating / 5) * 50 + (min(review_count, 100) / 100) * 30 + (profile_completeness / 100) * 20)
    top_2_gaps = []
    if profile_completeness < 100:
        top_2_gaps.append(f"Profile completeness is at {profile_completeness}%, missing key information fields.")
    if review_count < 10:
        top_2_gaps.append(f"Review count is low ({review_count}), which damages local trust.")
    if star_rating < 4.0 and star_rating > 0:
        top_2_gaps.append(f"Star rating is {star_rating}, below the ideal 4.0+ threshold.")
    if not top_2_gaps:
        top_2_gaps = ["No profile found in Google Business profile lookup."]

    return {
        "reputation_score": reputation_score,
        "star_rating": star_rating,
        "review_count": review_count,
        "profile_completeness": profile_completeness,
        "sentiment_summary": sentiment_summary,
        "top_2_gaps": top_2_gaps[:2],
        "data_source": "live"
    }

def _mock_response() -> dict:
    return {
        "reputation_score": 0,
        "star_rating": 0.0,
        "review_count": 0,
        "profile_completeness": 0,
        "sentiment_summary": "No profile found (fetch failed).",
        "top_2_gaps": [
            "Data fetch failed."
        ],
        "data_source": "fallback"
    }
