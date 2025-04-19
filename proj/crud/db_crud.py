# db_crud.py

from sqlmodel import Session, select
from models.db_model import UserDatabase
from models.query_model import QueryHistory
from utils.encryption import encrypt_password, decrypt_password
from typing import List
from schemas.db_schemas import UserDatabaseCreate, UserDatabaseUpdate


def create_user_database(session: Session, user_id: int, data: UserDatabaseCreate):
    encrypted_pass = encrypt_password(data.db_password)
    user_db = UserDatabase(
        user_id=user_id,
        host=data.host,
        port=data.port,
        db_user=data.db_user,
        db_password_encrypted=encrypted_pass,
        db_name=data.db_name
    )
    session.add(user_db)
    session.commit()
    session.refresh(user_db)
    return user_db


def get_user_databases(session: Session, user_id: int):
    return session.exec(
        select(UserDatabase).where(UserDatabase.user_id == user_id)
    ).all()


def update_user_database(session: Session, db_id: int, user_id: int, updates: UserDatabaseUpdate):
    db = session.get(UserDatabase, db_id)
    if not db or db.user_id != user_id:
        return None

    update_data = updates.dict(exclude_unset=True)

    for key, value in update_data.items():
        if key == "db_password":
            value = encrypt_password(value)
            setattr(db, "db_password_encrypted", value)
        elif hasattr(db, key):
            setattr(db, key, value)

    session.add(db)
    session.commit()
    session.refresh(db)
    return db


def delete_user_database(session: Session, db_id: int, user_id: int):
    db = session.get(UserDatabase, db_id)
    if not db or db.user_id != user_id:
        return False
    session.delete(db)
    session.commit()
    return True

def add_query_history(session: Session, db_id: int, prompt: str, sql: str, success: bool = True, error: str = None):
    history = QueryHistory(
        user_database_id=db_id,
        original_prompt=prompt,
        generated_sql=sql,
        success=success,
        error_message=error
    )
    session.add(history)
    session.commit()
    session.refresh(history)
    return history


def delete_query_history(session: Session, history_id: int, user_id: int):
    history = session.get(QueryHistory, history_id)
    if not history:
        return False
    db = session.get(UserDatabase, history.user_database_id)
    if db.user_id != user_id:
        return False
    session.delete(history)
    session.commit()
    return True


def delete_all_query_history_for_db(session: Session, db_id: int, user_id: int):
    db = session.get(UserDatabase, db_id)
    if not db or db.user_id != user_id:
        return False
    session.exec(
        select(QueryHistory).where(QueryHistory.user_database_id == db_id)
    ).delete()
    session.commit()
    return True


def get_query_history_by_database(session: Session, db_id: int) -> List[QueryHistory]:
    return session.exec(
        select(QueryHistory).where(QueryHistory.user_database_id == db_id)
    ).all()
