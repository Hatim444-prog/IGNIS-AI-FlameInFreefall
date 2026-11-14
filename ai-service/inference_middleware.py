from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from inference_context import config_from_request, reset_inference_config, set_inference_config


class InferenceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        token = set_inference_config(config_from_request(request))
        try:
            return await call_next(request)
        finally:
            reset_inference_config(token)
