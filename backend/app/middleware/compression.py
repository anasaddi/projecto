"""GZip compression middleware — compresses responses above 500 bytes."""
from fastapi.middleware.gzip import GZipMiddleware

GZIP_MINIMUM_SIZE = 500  # bytes


def add_compression(app):
    app.add_middleware(GZipMiddleware, minimum_size=GZIP_MINIMUM_SIZE)
