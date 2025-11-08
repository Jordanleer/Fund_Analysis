from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, funds

app = FastAPI(
    title="Fund Analysis API",
    description="API for analyzing mutual fund performance using Morningstar data",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(funds.router, prefix="/api", tags=["funds"])


@app.get("/")
async def root():
    return {
        "message": "Fund Analysis API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
