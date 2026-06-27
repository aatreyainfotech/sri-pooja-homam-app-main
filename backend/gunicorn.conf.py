import multiprocessing

# Use uvicorn workers for ASGI (FastAPI)
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:8000"
timeout = 600
workers = 2
