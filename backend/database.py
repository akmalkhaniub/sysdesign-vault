import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from models import Base

load_dotenv()

# Configurable database URL
# Postgres format: postgresql+psycopg://username:password@localhost:5432/sysdesign_vault
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/sysdesign_vault")

# Test if postgres is connectable; if not, fallback to sqlite for immediate development
def get_engine():
    try:
        # Check if URL starts with postgresql
        if DATABASE_URL.startswith("postgresql"):
            # try connecting synchronously to test auth
            sync_url = DATABASE_URL.replace("+psycopg", "")
            test_engine = create_engine(sync_url, connect_args={"connect_timeout": 2})
            with test_engine.connect() as conn:
                pass
            print(f"Connected to PostgreSQL: {DATABASE_URL}")
            return create_async_engine(DATABASE_URL, echo=False)
    except Exception as e:
        print(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(BASE_DIR, "sysdesign_vault.db")
    sqlite_url = f"sqlite+aiosqlite:///{sqlite_path.replace(os.sep, '/')}"
    return create_async_engine(sqlite_url, echo=False)

engine = get_engine()
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized successfully.")

async def get_db():
    async with async_session() as session:
        yield session
