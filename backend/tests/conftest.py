import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base, get_db
from app.config import get_settings

# Use in-memory SQLite for tests to avoid requiring Postgres
TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(test_engine):
    Session = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        # Provide admin access by default in tests
        c.headers.update({"x-km-access": get_settings().admin_access_key})
        yield c
    app.dependency_overrides.clear()
