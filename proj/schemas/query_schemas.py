from typing import Optional
from sqlmodel import SQLModel
from datetime import datetime


class QueryHistoryCreate(SQLModel):
    original_prompt: str
    generated_sql: str
    success: bool = True
    error_message: Optional[str] = None


class QueryHistoryRead(SQLModel):
    id: int
    user_database_id: int
    original_prompt: str
    generated_sql: str
    success: bool
    error_message: Optional[str]
    executed_at: datetime

