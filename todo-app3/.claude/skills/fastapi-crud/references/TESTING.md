# FastAPI Testing Best Practices

## Test Client Setup

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/api/v1/users/",
        json={"name": "John Doe", "email": "john@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "John Doe"
    assert "id" in data
```

## Database Testing

### Test Database Configuration
```python
import tempfile
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Base

# Create temporary database for testing
SQLALCHEMY_DATABASE_URL = f"sqlite:///./test_{tempfile.mktemp()}.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)
```

### Test Database Session
```python
from fastapi import FastAPI
from fastapi.params import Depends
from sqlalchemy.orm import Session

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
```

## Fixture Patterns

```python
import pytest
from fastapi.testclient import TestClient
from main import app, get_db
from database import TestingSessionLocal

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
```

## API Testing Patterns

### CRUD Operation Tests
```python
def test_create_entity(client, db_session):
    payload = {
        "name": "Test Entity",
        "description": "A test entity"
    }
    response = client.post("/api/v1/entities/", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "Test Entity"
    assert data["id"] > 0

def test_get_entity(client, db_session):
    # First create an entity
    create_response = client.post("/api/v1/entities/", json={
        "name": "Test Entity"
    })
    entity_id = create_response.json()["id"]

    # Then get it
    response = client.get(f"/api/v1/entities/{entity_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Entity"

def test_update_entity(client, db_session):
    # Create entity
    create_response = client.post("/api/v1/entities/", json={
        "name": "Original Name"
    })
    entity_id = create_response.json()["id"]

    # Update entity
    update_payload = {"name": "Updated Name"}
    response = client.put(f"/api/v1/entities/{entity_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"

def test_delete_entity(client, db_session):
    # Create entity
    create_response = client.post("/api/v1/entities/", json={
        "name": "To Delete"
    })
    entity_id = create_response.json()["id"]

    # Delete entity
    response = client.delete(f"/api/v1/entities/{entity_id}")
    assert response.status_code == 200

    # Verify deletion
    get_response = client.get(f"/api/v1/entities/{entity_id}")
    assert get_response.status_code == 404
```

## Validation Testing

```python
def test_invalid_input_validation(client):
    # Test missing required field
    response = client.post("/api/v1/entities/", json={})
    assert response.status_code == 422

    # Test invalid field type
    response = client.post("/api/v1/entities/", json={
        "name": 123  # Should be string
    })
    assert response.status_code == 422

    # Test field validation rules
    response = client.post("/api/v1/entities/", json={
        "name": ""  # Should not be empty
    })
    assert response.status_code == 422
```

## Authentication Testing

```python
def test_unauthorized_access(client):
    response = client.get("/api/v1/protected-endpoint/")
    assert response.status_code == 401

def test_authorized_access(client, valid_token):
    headers = {"Authorization": f"Bearer {valid_token}"}
    response = client.get("/api/v1/protected-endpoint/", headers=headers)
    assert response.status_code == 200
```

## Performance Testing

```python
import time

def test_endpoint_performance(client):
    start_time = time.time()
    response = client.get("/api/v1/entities/")
    end_time = time.time()

    response_time = end_time - start_time
    assert response_time < 1.0  # Should respond in under 1 second
    assert response.status_code == 200
```

## Error Handling Tests

```python
def test_not_found_error(client):
    response = client.get("/api/v1/entities/999999/")
    assert response.status_code == 404
    assert "detail" in response.json()

def test_validation_error(client):
    response = client.post("/api/v1/entities/", json={
        "invalid_field": "value"
    })
    assert response.status_code == 422
```

## Test Organization

### Directory Structure
```
tests/
├── conftest.py          # Shared fixtures
├── test_main.py         # Application-level tests
├── test_users.py        # User-related tests
├── test_auth.py         # Authentication tests
└── database/
    └── test_models.py   # Database model tests
```

### Conftest Example
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from main import app
from database import engine, Base

@pytest.fixture(scope="session")
def test_client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as client:
        yield client
    Base.metadata.drop_all(bind=engine)
```

## Running Tests

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_users.py

# Run tests with verbose output
pytest -v

# Run tests in parallel
pytest -n auto
```