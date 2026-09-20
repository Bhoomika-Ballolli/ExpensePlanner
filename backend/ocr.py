"""
ocr.py
------
Handles receipt image processing using OpenCV + Tesseract OCR.

Flow:
    1. Read uploaded image bytes with OpenCV
    2. Preprocess (grayscale + threshold) to make text clearer for OCR
    3. Run pytesseract to extract raw text
    4. Use simple regex/keyword rules to guess amount, date, description
    5. Suggest a category using keyword matching (NOT machine learning -
       this is intentionally simple and explainable)

This feature is OPTIONAL. If Tesseract is not installed, or OCR fails,
we return success=False with a friendly message and the raw text (if any)
so the user can still fill the form manually.
"""

import re
import io
from datetime import datetime

import numpy as np
import cv2
from PIL import Image

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


# Simple keyword -> category mapping.
# This is intentionally basic and explainable (no ML classifier needed).
CATEGORY_KEYWORDS = {
    "Groceries": ["rice", "vegetable", "tomato", "onion", "grocery", "grocer",
                  "supermarket", "mart", "fruits", "milk", "provisions"],
    "Food": ["pizza", "restaurant", "burger", "cafe", "coffee", "food",
             "dine", "meal", "hotel", "biryani", "swiggy", "zomato"],
    "Transport": ["bus", "taxi", "uber", "ola", "fuel", "petrol", "diesel",
                  "auto", "train", "ticket", "metro", "fare"],
    "Shopping": ["mall", "store", "shop", "clothing", "apparel", "fashion",
                 "amazon", "flipkart", "myntra", "footwear"],
    "Education": ["book", "notebook", "stationery", "course", "tuition",
                  "fees", "college", "school", "exam"],
    "Bills": ["electricity", "water bill", "recharge", "internet",
              "broadband", "bill", "rent", "wifi"],
    "Healthcare": ["pharmacy", "medicine", "hospital", "clinic", "medical",
                   "doctor", "chemist", "tablet"],
    "Entertainment": ["movie", "cinema", "netflix", "game", "concert",
                       "theatre", "prime video", "spotify"],
}


def _suggest_category(text):
    """
    Look through the OCR text for keywords and suggest the best-matching
    category. Returns "Other" if nothing matches.
    """
    text_lower = text.lower()
    best_category = "Other"
    best_matches = 0

    for category, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text_lower)
        if matches > best_matches:
            best_matches = matches
            best_category = category

    return best_category


def _extract_amount(text):
    """
    Try to find the total amount from receipt text.
    Looks for patterns like "Total: 450.00", "Rs 450", "₹450", etc.
    Falls back to picking the largest number-looking value found.
    """
    # Look for a line containing "total" followed by a number
    total_pattern = re.compile(
        r"(?:total|amount|grand total|net amount)[^\d]{0,10}([\d,]+\.?\d{0,2})",
        re.IGNORECASE,
    )
    match = total_pattern.search(text)
    if match:
        raw = match.group(1).replace(",", "")
        try:
            return float(raw)
        except ValueError:
            pass

    # Fallback: find all numbers that look like currency amounts,
    # and pick the largest one (often the total on a receipt).
    numbers = re.findall(r"\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?", text)
    amounts = []
    for n in numbers:
        try:
            amounts.append(float(n.replace(",", "")))
        except ValueError:
            continue

    if amounts:
        return max(amounts)

    return None


def _extract_date(text):
    """
    Try to find a date in common formats: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
    Returns an ISO date string (yyyy-mm-dd) or None if not found.
    """
    patterns = [
        (r"(\d{2})[/-](\d{2})[/-](\d{4})", "%d/%m/%Y"),
        (r"(\d{4})[/-](\d{2})[/-](\d{2})", "%Y-%m-%d"),
        (r"(\d{2})[/-](\d{2})[/-](\d{2})", "%d/%m/%y"),
    ]

    for pattern, fmt in patterns:
        match = re.search(pattern, text)
        if match:
            raw_date = match.group(0).replace("-", "/")
            try:
                parsed = datetime.strptime(raw_date, fmt.replace("-", "/"))
                return parsed.date().isoformat()
            except ValueError:
                continue

    return None


def _extract_description(text):
    """
    Grab a short, human-readable snippet from the receipt to use as
    the expense description (e.g. store name from the first text line).
    """
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return ""

    # The first non-empty line is often the store/shop name on a receipt
    description = lines[0]
    return description[:100]  # keep it short


def process_receipt(file_storage):
    """
    Main entry point called by the /api/ocr Flask route.

    file_storage: a Werkzeug FileStorage object (the uploaded image file)

    Returns a dict describing what was extracted, and whether extraction
    was confident enough to trust.
    """
    if not TESSERACT_AVAILABLE:
        return {
            "success": False,
            "message": (
                "OCR engine (pytesseract) is not installed on this server. "
                "Please enter the expense details manually."
            ),
        }

    try:
        # Read the uploaded file into memory and decode as an OpenCV image
        file_bytes = np.frombuffer(file_storage.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "success": False,
                "message": "Could not read the uploaded image. Please try a clearer photo.",
            }

        # ---- Image preprocessing to improve OCR accuracy ----
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Otsu's thresholding automatically finds a good black/white cutoff
        _, thresh = cv2.threshold(
            gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )

        # Convert back to a PIL image for pytesseract
        processed_image = Image.fromarray(thresh)

        # ---- Run OCR ----
        raw_text = pytesseract.image_to_string(processed_image)

        if not raw_text or len(raw_text.strip()) < 3:
            return {
                "success": False,
                "message": (
                    "Could not confidently extract all information. "
                    "Please review and enter the details manually."
                ),
                "raw_text": raw_text,
            }

        amount = _extract_amount(raw_text)
        date = _extract_date(raw_text)
        description = _extract_description(raw_text)
        category = _suggest_category(raw_text)

        # We consider extraction "confident" only if we found BOTH
        # an amount and something usable as a description.
        confident = amount is not None and description != ""

        return {
            "success": True,
            "confident": confident,
            "raw_text": raw_text.strip(),
            "extracted": {
                "amount": amount,
                "date": date or datetime.today().date().isoformat(),
                "description": description,
                "category": category,
            },
            "message": (
                "Details extracted successfully. Please verify before saving."
                if confident
                else "Could not confidently extract all information. Please review and enter the details manually."
            ),
        }

    except Exception as exc:
        # Never leak a raw Python stack trace to the frontend
        return {
            "success": False,
            "message": "An error occurred while processing the receipt. Please enter details manually.",
            "error": str(exc),
        }
