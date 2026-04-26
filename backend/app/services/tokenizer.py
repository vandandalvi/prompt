from __future__ import annotations


def estimate_tokens(text: str) -> int:
    text = text.strip()
    if not text:
        return 0

    try:
        import tiktoken

        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        return max(1, int(len(text.split()) * 1.3))


def token_reduction(raw: str, optimized: str) -> dict:
    raw_tokens = estimate_tokens(raw)
    optimized_tokens = estimate_tokens(optimized)
    reduction = 0.0
    if raw_tokens > 0:
        reduction = ((raw_tokens - optimized_tokens) / raw_tokens) * 100

    return {
        "raw_tokens": raw_tokens,
        "optimized_tokens": optimized_tokens,
        "reduction_percent": round(reduction, 2),
    }
