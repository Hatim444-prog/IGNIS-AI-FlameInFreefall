"""Ollama (local) or NVIDIA NIM (hosted) for chat, vision, and embeddings."""
from __future__ import annotations

import base64
import logging
import os
from typing import Any

import httpx
import numpy as np
import ollama

from inference_context import InferenceConfig, get_inference_config

logger = logging.getLogger(__name__)

OLLAMA_TEXT = os.getenv("IGNIS_TEXT_MODEL", "llama3.1:8b")
OLLAMA_VISION = os.getenv("VISION_MODEL", "gemma4:e4b")
OLLAMA_EMBED = os.getenv("IGNIS_EMBED_MODEL", "nomic-embed-text")

# llama3.1:8b on Ollama ≈ Nemotron 3.5 Lightning on NIM (8.x-era Llama endpoints are often EOL on the catalog).
NIM_TEXT = os.getenv("NIM_TEXT_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b")
NIM_VISION = os.getenv("NIM_VISION_MODEL", "nvidia/nemotron-3.5-bolt-e4b")
NIM_EMBED = os.getenv("NIM_EMBED_MODEL", "nvidia/nv-embedqa-e5-v5")

EXPECTED_EMBED_DIM = int(os.getenv("IGNIS_EMBED_DIM", "768"))


class InferenceError(RuntimeError):
    pass


def model_map(cfg: InferenceConfig) -> dict[str, Any]:
    return {
        "chat_backend": cfg.chat_backend,
        "embed_backend": cfg.embed_backend,
        "ollama": {
            "text": OLLAMA_TEXT,
            "vision": OLLAMA_VISION,
            "embed": OLLAMA_EMBED,
        },
        "nim": {
            "text": NIM_TEXT,
            "vision": NIM_VISION,
            "embed": NIM_EMBED,
            "base_url": cfg.nim_base_url,
            "api_key_configured": bool(cfg.nim_api_key),
        },
        "embed_dimension_required": EXPECTED_EMBED_DIM,
        "note": (
            "Vector search in Postgres expects 768-d Nomic embeddings. "
            "Use embed backend 'ollama' unless you re-indexed for another model."
        ),
    }


def _require_nim_key(cfg: InferenceConfig) -> str:
    if not cfg.nim_api_key:
        raise InferenceError(
            "NVIDIA API key missing. Set IGNIS_NIM_API_KEY in .env (repo root or "
            "frontend), paste a key in /test/, or send Authorization: Bearer "
            "<key> / X-NVIDIA-Api-Key."
        )
    return cfg.nim_api_key


def _nim_post(cfg: InferenceConfig, path: str, payload: dict) -> dict:
    url = f"{cfg.nim_base_url}/{path.lstrip('/')}"
    headers = {
        "Authorization": f"Bearer {_require_nim_key(cfg)}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(url, headers=headers, json=payload)
    except httpx.HTTPError as exc:
        raise InferenceError(f"NIM HTTP error: {exc}") from exc
    if response.status_code >= 400:
        detail = response.text[:500]
        if response.status_code == 410:
            raise InferenceError(
                f"NIM model unavailable (end of life): {payload.get('model')}. "
                f"Set NIM_TEXT_MODEL in .env to a current build.nvidia.com model."
            )
        if response.status_code in (401, 403):
            raise InferenceError(
                "NIM rejected the API key (401/403). Check build.nvidia.com → API key."
            )
        raise InferenceError(f"NIM {response.status_code}: {detail}")
    return response.json()


def _ollama_messages_to_nim(messages: list[dict]) -> list[dict]:
    out: list[dict] = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        images: list[bytes] = msg.get("images") or []
        if images:
            parts: list[dict] = []
            if content:
                parts.append({"type": "text", "text": str(content)})
            for raw in images:
                b64 = base64.standard_b64encode(raw).decode("ascii")
                parts.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    }
                )
            out.append({"role": role, "content": parts})
        else:
            out.append({"role": role, "content": str(content)})
    return out


def vision_model(cfg: InferenceConfig | None = None) -> str:
    provider = (cfg or get_inference_config()).chat_backend
    return OLLAMA_VISION if provider == "ollama" else NIM_VISION


def chat(
    messages: list[dict],
    *,
    temperature: float = 0.1,
    num_ctx: int | None = None,
    cfg: InferenceConfig | None = None,
) -> str:
    cfg = cfg or get_inference_config()
    model = OLLAMA_TEXT if cfg.chat_backend == "ollama" else NIM_TEXT
    if any(message.get("images") for message in messages):
        model = vision_model(cfg)
    if cfg.chat_backend == "ollama":
        options: dict[str, Any] = {"temperature": temperature}
        if num_ctx is not None:
            options["num_ctx"] = num_ctx
        try:
            result = ollama.chat(
                model=model,
                messages=messages,
                options=options,
            )
        except Exception as exc:
            raise InferenceError(
                f"Ollama chat failed ({type(exc).__name__}). "
                f"Check that Ollama can load {model}."
            ) from exc
        return result.message.content or ""

    payload: dict[str, Any] = {
        "model": model,
        "messages": _ollama_messages_to_nim(messages),
        "temperature": temperature,
        "max_tokens": 4096,
    }
    data = _nim_post(cfg, "chat/completions", payload)
    try:
        return data["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError) as exc:
        raise InferenceError(f"Unexpected NIM chat response shape: {data}") from exc


def embed_text(
    text: str,
    *,
    task: str = "query",
    cfg: InferenceConfig | None = None,
) -> np.ndarray:
    cfg = cfg or get_inference_config()
    prefix = "search_document: " if task == "document" else "search_query: "
    prepared = prefix + text if cfg.embed_backend == "ollama" else text

    if cfg.embed_backend == "ollama":
        try:
            response = ollama.embed(model=OLLAMA_EMBED, input=prepared)
        except Exception as exc:
            raise InferenceError(
                f"Ollama embed failed ({type(exc).__name__}). "
                "Pull nomic-embed-text or switch embed backend to NIM in the UI."
            ) from exc
        vector = np.asarray(response.embeddings[0], dtype=np.float32)
    else:
        input_type = "passage" if task == "document" else "query"
        payload = {
            "model": NIM_EMBED,
            "input": [prepared],
            "encoding_format": "float",
            "input_type": input_type,
        }
        data = _nim_post(cfg, "embeddings", payload)
        try:
            vector = np.asarray(data["data"][0]["embedding"], dtype=np.float32)
        except (KeyError, IndexError, TypeError) as exc:
            raise InferenceError(f"Unexpected NIM embed response: {data}") from exc

    if vector.shape != (EXPECTED_EMBED_DIM,) or not np.isfinite(vector).all():
        raise InferenceError(
            f"Embedding dimension is {vector.shape}; expected {EXPECTED_EMBED_DIM}. "
            "Use Ollama (nomic) for embeddings or re-index the database."
        )
    return vector


def _check_nim(cfg: InferenceConfig, *, test_embed: bool) -> dict[str, Any]:
    if not cfg.nim_api_key:
        return {"ok": False, "message": "No NVIDIA API key provided."}
    try:
        reply = chat(
            [{"role": "user", "content": "Reply with the single word OK."}],
            temperature=0,
            cfg=cfg,
        )
        chat_ok = "ok" in reply.strip().lower()[:20]
        result: dict[str, Any] = {
            "ok": chat_ok,
            "message": "NIM chat accepted your API key."
            if chat_ok
            else f"NIM responded but output was unexpected: {reply[:80]!r}",
            "model": NIM_TEXT,
        }
    except InferenceError as exc:
        return {"ok": False, "message": str(exc), "model": NIM_TEXT}

    if test_embed:
        try:
            vec = embed_text("ignis connectivity probe", task="query", cfg=cfg)
            result["embed_ok"] = True
            result["embed_dim"] = int(vec.shape[0])
        except InferenceError as exc:
            result["embed_ok"] = False
            result["embed_message"] = str(exc)
    return result


def _check_ollama(*, test_embed: bool) -> dict[str, Any]:
    try:
        listed = ollama.list()
        names = [
            (m.model if hasattr(m, "model") else m.get("model", ""))
            for m in getattr(listed, "models", []) or []
        ]
    except Exception as exc:
        return {
            "ok": False,
            "message": f"Cannot reach Ollama ({type(exc).__name__}). Start Ollama on this machine.",
        }

    def _has(want: str) -> bool:
        base = want.split(":")[0]
        return any(want in n or n.startswith(base) for n in names)

    missing = [m for m in (OLLAMA_TEXT, OLLAMA_EMBED) if not _has(m)]
    base = {
        "ok": len(missing) == 0,
        "message": "Ollama is running with expected models."
        if not missing
        else f"Ollama reachable but missing models: {', '.join(missing)}",
        "models_reported": names[:12],
    }
    if test_embed and not missing:
        try:
            embed_text("probe", task="query", cfg=InferenceConfig(
                chat_backend="ollama",
                embed_backend="ollama",
                nim_api_key=None,
                nim_base_url="https://integrate.api.nvidia.com/v1",
            ))
            base["embed_ok"] = True
            base["embed_dim"] = EXPECTED_EMBED_DIM
        except InferenceError as exc:
            base["embed_ok"] = False
            base["embed_message"] = str(exc)
    return base


def diagnose_inference(
    cfg: InferenceConfig | None = None,
    *,
    scope: str = "all",
) -> dict[str, Any]:
    """Run lightweight connectivity checks for the active inference settings."""
    cfg = cfg or get_inference_config()
    checks: dict[str, Any] = {}
    need_nim = cfg.chat_backend == "nim" or cfg.embed_backend == "nim"
    need_ollama = cfg.chat_backend == "ollama" or cfg.embed_backend == "ollama"

    if scope in ("all", "nim") and need_nim:
        checks["nim"] = _check_nim(
            cfg, test_embed=cfg.embed_backend == "nim"
        )
    elif scope == "nim" and not need_nim:
        checks["nim"] = {"ok": True, "message": "NIM not required for current mode."}

    if scope in ("all", "ollama") and need_ollama:
        checks["ollama"] = _check_ollama(test_embed=cfg.embed_backend == "ollama")
    elif scope == "ollama" and not need_ollama:
        checks["ollama"] = {"ok": True, "message": "Ollama not required for current mode."}

    relevant = [c for c in checks.values() if c.get("message") != "Ollama not required for current mode." and c.get("message") != "NIM not required for current mode."]
    all_ok = all(c.get("ok") for c in relevant) if relevant else True
    return {
        "ok": all_ok,
        "scope": scope,
        "config": model_map(cfg),
        "checks": checks,
    }
