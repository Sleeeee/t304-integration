import os
from fastapi import FastAPI, HTTPException
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


def get_session():
    with Session(engine) as session:
        yield session


app = FastAPI()


@app.get("/")
def root():
    try:
        with Session(engine) as session:
            session.execute(text("SELECT 1"))
        return {"message": "Database connection successful!"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {e}")
