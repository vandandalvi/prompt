from __future__ import annotations

import re
from dataclasses import dataclass

FILLER_WORDS = {
    # English fillers
    "um", "uh", "like", "you know", "basically", "actually", "hmm", "please",
    "so", "well", "right", "okay", "ok", "hello", "hi", "hey",
    # Hindi / Hinglish fillers
    "matlab", "haan", "achha", "toh", "bhai", "yaar", "dekho", "arey",
    "na", "hai", "karo", "do", "de", "mujhe", "ek", "ke", "liye",
}

SYMBOL_MAP = {
    "&": "and",
    "%": "percent",
    "@": "at",
    "+": "plus",
    "#": "hashtag",
}

DIGIT_WORDS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
    "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
}


@dataclass
class CleaningResult:
    cleaned_text: str
    removed_words: list[str]
    replaced_words: dict[str, str]


NOISE_PATTERN = re.compile(r"^[\W_\d]+$")


def normalize_symbols(text: str) -> tuple[str, dict[str, str]]:
    replaced: dict[str, str] = {}
    normalized = text
    for symbol, replacement in SYMBOL_MAP.items():
        if symbol in normalized:
            normalized = normalized.replace(symbol, f" {replacement} ")
            replaced[symbol] = replacement
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized, replaced


def normalize_numbers(text: str) -> tuple[str, dict[str, str]]:
    replaced: dict[str, str] = {}
    words = text.split()
    result = []
    for word in words:
        stripped = word.strip(".,!?")
        if stripped in DIGIT_WORDS:
            replacement = DIGIT_WORDS[stripped]
            suffix = word[len(stripped):]
            result.append(replacement + suffix)
            replaced[stripped] = replacement
        else:
            result.append(word)
    return " ".join(result), replaced


def remove_fillers(text: str) -> tuple[str, list[str]]:
    words = text.split()
    kept = []
    removed = []

    for word in words:
        token = word.lower().strip(".,!?")
        if token in FILLER_WORDS:
            removed.append(word)
            continue
        kept.append(word)
    return " ".join(kept).strip(), removed


def is_noise(text: str) -> bool:
    return bool(NOISE_PATTERN.match(text.strip())) or len(text.strip()) < 3


def clean_text(text: str) -> CleaningResult:
    symbol_normalized, sym_replaced = normalize_symbols(text)
    number_normalized, num_replaced = normalize_numbers(symbol_normalized)
    cleaned, removed = remove_fillers(number_normalized)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    all_replaced = {**sym_replaced, **num_replaced}
    return CleaningResult(cleaned_text=cleaned, removed_words=removed, replaced_words=all_replaced)
