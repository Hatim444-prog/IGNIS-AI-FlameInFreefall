"""PostgreSQL connection helpers for local Docker or Neon (DATABASE_URL)."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import psycopg
from dotenv import load_dotenv
from pgvector.psycopg import register_vector
from psycopg.rows import RowFactory, dict_row

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_SERVICE_ROOT = Path(__file__).resolve().parent

load_dotenv(_PROJECT_ROOT / ".env")
load_dotenv(_SERVICE_ROOT / ".env", override=False)


def _ensure_sslmode(conninfo: str) -> str:
    parsed = urlparse(conninfo)
    if parsed.scheme not in ("postgresql", "postgres"):
        return conninfo
    host = (parsed.hostname or "").lower()
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if host.endswith(".neon.tech") and "sslmode" not in query:
        query["sslmode"] = "require"
    return urlunparse(parsed._replace(query=urlencode(query)))


def database_display_name() -> str:
    url = (os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "").strip()
    if url:
        path = urlparse(url).path.lstrip("/")
        return path or "postgres"
    return os.getenv("IGNIS_DB_NAME", os.getenv("POSTGRES_DB", "ignis_db"))


def build_connect_kwargs(**extra: Any) -> dict[str, Any]:
    url = (os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "").strip()
    kwargs: dict[str, Any] = {
        "connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", "8")),
        **extra,
    }
    if url:
        kwargs["conninfo"] = _ensure_sslmode(url)
        return kwargs

    password = os.getenv("POSTGRES_PASSWORD")
    if not password:
        raise RuntimeError(
            "Set DATABASE_URL for Neon, or POSTGRES_PASSWORD for local Docker Postgres."
        )
    kwargs.update(
        host=os.getenv("IGNIS_DB_HOST", os.getenv("POSTGRES_HOST", "127.0.0.1")),
        port=int(os.getenv("IGNIS_DB_PORT", os.getenv("POSTGRES_PORT", "5433"))),
        dbname=os.getenv("IGNIS_DB_NAME", os.getenv("POSTGRES_DB", "ignis_db")),
        user=os.getenv("IGNIS_DB_USER", os.getenv("POSTGRES_USER", "ignis")),
        password=password,
    )
    return kwargs


def connect_db(
    *,
    register_pgvector: bool = True,
    row_factory: RowFactory | None = dict_row,
    **extra: Any,
) -> psycopg.Connection:
    kwargs = build_connect_kwargs(**extra)
    if row_factory is not None:
        kwargs["row_factory"] = row_factory
    conn = psycopg.connect(**kwargs)
    if register_pgvector:
        register_vector(conn)
    return conn
