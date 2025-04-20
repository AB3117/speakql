from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from models.user_model import User
from database import init_db, get_session
from auth.auth_handler import create_access_token, hash_password, verify_password
from auth.auth_bearer import JWTBearer
from routers.agent_routes import router as agent_router
from crud.db_crud import (
    create_user_database,
    get_user_databases,
    update_user_database,
    delete_user_database,
    get_query_history_by_database,
)
from crud.db_crud import get_user_databases

from schemas.user_schemas import UserCreate, UserRead, UserLogin
from schemas.db_schemas import UserDatabaseCreate, UserDatabaseUpdate, UserDatabaseRead
from typing import List
from schemas.query_schemas import *
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(agent_router, prefix="/agent", tags=["agent"])
# Init DB
init_db()

# ----------- Auth Routes -----------

@app.post("/signup", response_model=UserRead)
def signup(user: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == user.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = hash_password(user.password)
    db_user = User(username=user.username, password_hash=hashed_pw)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@app.post("/login")
def login(credentials: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == credentials.username)).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@app.get("/me", dependencies=[Depends(JWTBearer())])
def read_current_user(token_data: dict = Depends(JWTBearer()), session: Session = Depends(get_session)):
    user_id = int(token_data["sub"])
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": user.username, "user_id": user.id}



@app.post("/databases", dependencies=[Depends(JWTBearer())])
def add_db(
    db_data: UserDatabaseCreate,
    session: Session = Depends(get_session),
    token_data: dict = Depends(JWTBearer())
):
    user_id = int(token_data["sub"])
    db = create_user_database(session, user_id, db_data)
    return {"msg": "Database added successfully", "db_id": db.id}


@app.get("/get_databases", response_model=list[UserDatabaseRead], dependencies=[Depends(JWTBearer())])
def get_dbs(
    session: Session = Depends(get_session),
    token_data: dict = Depends(JWTBearer())
):
    user_id = int(token_data["sub"])
    return get_user_databases(session, user_id)


@app.put("/databases/{db_id}", dependencies=[Depends(JWTBearer())])
def update_db(
    db_id: int,
    updates: UserDatabaseUpdate,
    session: Session = Depends(get_session),
    token_data: dict = Depends(JWTBearer())
):
    user_id = int(token_data["sub"])
    updated = update_user_database(session, db_id, user_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Database not found or unauthorized")
    return {"msg": "Database updated", "db_id": updated.id}


@app.delete("/databases/{db_id}", dependencies=[Depends(JWTBearer())])
def delete_db(
    db_id: int,
    session: Session = Depends(get_session),
    token_data: dict = Depends(JWTBearer())
):
    user_id = int(token_data["sub"])
    success = delete_user_database(session, db_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Database not found or unauthorized")
    return {"msg": "Database deleted successfully"}

@app.get("/query-history/{db_id}", response_model=List[QueryHistoryRead], dependencies=[Depends(JWTBearer())])
def get_query_history(
    db_id: int,
    session: Session = Depends(get_session),
    token_data: dict = Depends(JWTBearer())
):
    user_id = int(token_data["sub"])

    # Ensure user has access to the database
    user_dbs = get_user_databases(session, user_id)
    if not any(db.id == db_id for db in user_dbs):
        raise HTTPException(status_code=403, detail="Forbidden: Database not accessible")

    query_history = get_query_history_by_database(session, db_id)
    return [QueryHistoryRead.model_validate(qh) for qh in query_history]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

