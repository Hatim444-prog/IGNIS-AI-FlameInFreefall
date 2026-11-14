"""Per-request inference backend (Ollama vs NVIDIA NIM)."""
from __future__ import annotations

import os
from contextvars import ContextVar, Token
from dataclasses import dataclass
from typing import Literal

from starlette.requests import Request

Backend = Literal["ollama", "nim"]

_DEFAULT = ContextVar("ignis_inference", default=None)


@dataclass(frozen=True)
class InferenceConfig:
    chat_backend: Backend
    embed_backend: Backend
    nim_api_key: str | None
    nim_base_url: str


def _parse_backend(raw: str | None, default: Backend) -> Backend:
    if not raw:
        return default
    value = raw.strip().lower()
    if value in ("ollama", "local"):
        return "ollama"
    if value in ("nim", "nvidia", "cloud"):
        return "nim"
    return default


def _nim_key_from_env() -> str | None:
    for name in ("IGNIS_NIM_API_KEY", "NVIDIA_API_KEY", "NIM_API_KEY"):
        raw = os.getenv(name)
        if raw and raw.strip():
            return raw.strip()
    return None


def config_from_env() -> InferenceConfig:
    """Server defaults; optional NIM key from .env (request headers may override)."""
    default = _parse_backend(os.getenv("IGNIS_INFERENCE_BACKEND"), "ollama")
    chat = _parse_backend(os.getenv("IGNIS_CHAT_BACKEND"), default)
    embed = _parse_backend(os.getenv("IGNIS_EMBED_BACKEND"), "ollama")
    base = os.getenv("NIM_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
    return InferenceConfig(
        chat_backend=chat,
        embed_backend=embed,
        nim_api_key=_nim_key_from_env(),
        nim_base_url=base,
    )


def get_inference_config() -> InferenceConfig:
    cfg = _DEFAULT.get()
    return cfg if cfg is not None else config_from_env()


def set_inference_config(cfg: InferenceConfig) -> Token:
    return _DEFAULT.set(cfg)


def reset_inference_config(token: Token) -> None:
    _DEFAULT.reset(token)


def _header_backend(request: Request, name: str) -> Backend | None:
    raw = request.headers.get(name)
    if not raw:
        return None
    try:
        return _parse_backend(raw, "ollama")
    except ValueError:
        return None


def config_from_request(request: Request) -> InferenceConfig:
    base = config_from_env()
    chat = _header_backend(request, "x-ignis-chat-backend") or _header_backend(
        request, "x-ignis-inference-backend"
    )
    embed = _header_backend(request, "x-ignis-embed-backend")

    auth = request.headers.get("authorization") or ""
    nim_key: str | None = None
    if auth.lower().startswith("bearer "):
        nim_key = auth[7:].strip() or None
    alt = request.headers.get("x-nvidia-api-key")
    if alt:
        nim_key = alt.strip() or nim_key
    if not nim_key:
        nim_key = base.nim_api_key

    return InferenceConfig(
        chat_backend=chat or base.chat_backend,
        embed_backend=embed or base.embed_backend,
        nim_api_key=nim_key,
        nim_base_url=base.nim_base_url,
    )
