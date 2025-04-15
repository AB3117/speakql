from sqlalchemy import create_engine
from cryptography.fernet import Fernet

def get_postgres_connection(db: UserDatabase, fernet: Fernet):
    password = fernet.decrypt(db.db_password_encrypted.encode()).decode()
    host = db.host or "localhost"
    port = db.port or 5432

    db_url = f"postgresql://{db.db_user}:{password}@{host}:{port}/{db.db_name}"
    return create_engine(db_url)
