from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, funds, returns, performance

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
app.include_router(returns.router, prefix="/api", tags=["returns"])
app.include_router(performance.router, prefix="/api", tags=["performance"])


@app.get("/")
async def root():
    return {
        "message": "Fund Analysis API",
        "version": "0.2.0",
        "phase": "Phase 2 - Performance Analysis",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
