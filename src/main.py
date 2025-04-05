from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.messages import router as messages_router
from api.auth import router as auth_router, get_current_user, User
from api.feedback import router as feedback_router
from api.analytics import router as analytics_router

app = FastAPI(title="CursorMCP API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(messages_router, prefix="/api", tags=["messages"])
app.include_router(feedback_router, prefix="/api", tags=["feedback"])
app.include_router(analytics_router, prefix="/api", tags=["analytics"])

@app.get("/")
async def root():
    return {"status": "ok", "message": "MCP API is running"}

@app.get("/api/me", tags=["auth"])
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
