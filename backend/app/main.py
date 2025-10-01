import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
from schema import * 

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


app = FastAPI()

#Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Permet de créer les tables au démarrage de l'application
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("Tables créées")


@app.get("/")
def root():
    try:
        with Session(engine) as session:
            session.execute(text("SELECT 1"))
        return {"message": "Database connection successful!"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {e}")