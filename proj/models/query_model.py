from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime


class QueryHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_database_id: int = Field(foreign_key="userdatabase.id")
    original_prompt: str
    generated_sql: str
    success: bool = True
    error_message: Optional[str] = None
    executed_at: datetime = Field(default_factory=datetime.utcnow)

    database: "UserDatabase" = Relationship(
        back_populates="history",
        sa_relationship_kwargs={"passive_deletes": True}
    ) 
