"""
FastAPI Testing Generator Skill
Generates comprehensive pytest unit tests and integration tests for FastAPI applications
"""
import os
import json
from typing import Dict, Any, List
from jinja2 import Template
import ast
import inspect

class FastAPITestingSkill:
    def __init__(self):
        self.skill_dir = os.path.dirname(__file__)
        self.templates_dir = os.path.join(self.skill_dir, "templates")

    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the FastAPI testing skill to generate tests
        """
        try:
            # Extract parameters
            test_type = params.get('test_type', 'unit')
            target_file = params.get('target_file')
            include_fixtures = params.get('include_fixtures', True)
            fastapi_app_path = params.get('fastapi_app_path', 'main:app')
            database_url = params.get('database_url', 'sqlite:///./test.db')

            # Validate parameters
            if test_type not in ['unit', 'integration', 'service', 'database', 'all']:
                raise ValueError(f"Invalid test_type: {test_type}. Must be one of: unit, integration, service, database, all")

            # Analyze target file if provided
            analyzed_code = None
            if target_file and os.path.exists(target_file):
                analyzed_code = self._analyze_code(target_file)

            # Generate test components based on parameters
            generated_files = []

            # Generate common configuration and fixtures
            if include_fixtures:
                conftest_content = self._generate_conftest(fastapi_app_path, database_url)
                generated_files.append({
                    'path': 'tests/conftest.py',
                    'content': conftest_content
                })

                fixtures_content = self._generate_fixtures()
                generated_files.append({
                    'path': 'tests/fixtures.py',
                    'content': fixtures_content
                })

            # Generate tests based on type
            if test_type in ['unit', 'all']:
                unit_test_content = self._generate_unit_test(target_file, analyzed_code)
                generated_files.append({
                    'path': f'tests/test_{os.path.basename(target_file).replace(".py", "") if target_file else "unit"}.py' if target_file else 'tests/test_unit.py',
                    'content': unit_test_content
                })

            if test_type in ['integration', 'all']:
                integration_test_content = self._generate_integration_test(fastapi_app_path)
                generated_files.append({
                    'path': 'tests/test_integration.py',
                    'content': integration_test_content
                })

            if test_type in ['service', 'all']:
                service_test_content = self._generate_service_test(target_file, analyzed_code)
                generated_files.append({
                    'path': f'tests/test_{os.path.basename(target_file).replace(".py", "_service") if target_file else "service"}.py' if target_file else 'tests/test_service.py',
                    'content': service_test_content
                })

            if test_type in ['database', 'all']:
                database_test_content = self._generate_database_test(database_url)
                generated_files.append({
                    'path': 'tests/test_database.py',
                    'content': database_test_content
                })

            return {
                'status': 'success',
                'message': f'Generated {test_type} tests for FastAPI application',
                'files': generated_files
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }

    def _analyze_code(self, file_path: str) -> Dict[str, Any]:
        """Analyze the target code to extract functions, classes, and endpoints"""
        try:
            with open(file_path, 'r') as f:
                code = f.read()

            tree = ast.parse(code)
            analysis = {
                'functions': [],
                'classes': [],
                'fastapi_routes': [],
                'imports': []
            }

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    # Check if it's a FastAPI route
                    is_route = False
                    route_info = {'name': node.name, 'params': [], 'decorators': []}

                    for decorator in getattr(node, 'decorator_list', []):
                        if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute):
                            if decorator.func.attr in ['get', 'post', 'put', 'delete', 'patch']:
                                is_route = True
                                route_info['method'] = decorator.func.attr
                                if decorator.args:
                                    route_info['path'] = ast.unparse(decorator.args[0]).strip('"\'')

                    if is_route:
                        analysis['fastapi_routes'].append(route_info)
                    else:
                        analysis['functions'].append({
                            'name': node.name,
                            'args': [arg.arg for arg in node.args.args if arg.arg != 'self'],
                            'returns': self._get_return_annotation(node)
                        })
                elif isinstance(node, ast.ClassDef):
                    analysis['classes'].append({
                        'name': node.name,
                        'methods': [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
                    })
                elif isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                    analysis['imports'].append(ast.unparse(node))

            return analysis
        except Exception:
            # If analysis fails, return empty analysis
            return {'functions': [], 'classes': [], 'fastapi_routes': [], 'imports': []}

    def _get_return_annotation(self, func_node):
        """Extract return annotation from function"""
        if func_node.returns:
            return ast.unparse(func_node.returns)
        return 'None'

    def _generate_conftest(self, fastapi_app_path: str, database_url: str) -> str:
        """Generate conftest.py with common fixtures"""
        template_content = '''import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from {{ fastapi_app_path.split(":")[0] }} import {{ fastapi_app_path.split(":")[1] }}
{% if database_url %}
from {{ fastapi_app_path.split(":")[0] }}.database import Base, get_db
{% endif %}

# Database setup for testing
{% if database_url %}
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the dependency
{{ fastapi_app_path.split(":")[1] }}.dependency_overrides[get_db] = override_get_db
{% endif %}

@pytest.fixture(scope="module")
def client():
    """Create a test client for the FastAPI app"""
    with TestClient({{ fastapi_app_path.split(":")[1] }}) as test_client:
        yield test_client

{% if database_url %}
@pytest.fixture(scope="function")
def db_session():
    """Create a database session for testing"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
{% endif %}

@pytest.fixture
def authenticated_client(client):
    """Create an authenticated test client"""
    # Example: login and get token for authenticated requests
    # response = client.post("/auth/login", json={"username": "test", "password": "test"})
    # token = response.json()["access_token"]
    # client.headers.update({"Authorization": f"Bearer {token}"})
    return client'''

        template = Template(template_content)
        return template.render(fastapi_app_path=fastapi_app_path, database_url=database_url)

    def _generate_fixtures(self) -> str:
        """Generate additional test fixtures"""
        template_content = '''import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, MagicMock
import json

# Sample data fixtures
@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123"
    }

@pytest.fixture
def sample_todo_data():
    """Sample todo data for testing"""
    return {
        "title": "Test Todo",
        "description": "Test description",
        "completed": False
    }

@pytest.fixture
def mock_database():
    """Mock database session for unit tests"""
    mock_session = Mock()
    mock_session.add = Mock()
    mock_session.commit = Mock()
    mock_session.refresh = Mock()
    mock_session.query = Mock()
    return mock_session

@pytest.fixture
def mock_service():
    """Mock service for testing"""
    mock_svc = Mock()
    return mock_svc

@pytest.fixture
def auth_token():
    """Sample authentication token"""
    return "fake-jwt-token"

# API response fixtures
@pytest.fixture
def successful_response():
    """Sample successful API response"""
    return {"status": "success", "data": {}}

@pytest.fixture
def error_response():
    """Sample error API response"""
    return {"status": "error", "message": "Something went wrong"}

# Model instance fixtures
class MockModel:
    """Base mock model for testing"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

@pytest.fixture
def mock_user():
    """Mock user instance"""
    return MockModel(
        id=1,
        username="testuser",
        email="test@example.com",
        is_active=True
    )

@pytest.fixture
def mock_todo():
    """Mock todo instance"""
    return MockModel(
        id=1,
        title="Test Todo",
        description="Test description",
        completed=False,
        user_id=1
    )'''

        template = Template(template_content)
        return template.render()

    def _generate_unit_test(self, target_file: str, analyzed_code: Dict[str, Any]) -> str:
        """Generate unit tests for functions/classes"""
        template_content = '''import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to the path to import the target module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import {{ target_file.split("/")[-1].replace(".py", "") if target_file else "main" }}

# Import fixtures
from .fixtures import *
from .conftest import *

{% if analyzed_code and analyzed_code['functions'] %}
{% for func in analyzed_code['functions'] %}
def test_{{ func['name'] }}_with_valid_input(mock_database):
    """Test {{ func['name'] }} with valid input"""
    from {{ target_file.replace(".py", "").replace("/", ".") if target_file else "main" }} import {{ func['name'] }}

    # Arrange
    # Set up test data

    # Act
    result = {{ func['name'] }}({% for arg in func['args'] %}arg_value{% if not loop.last %}, {% endif %}{% endfor %})  # Adjust based on actual function signature

    # Assert
    assert result is not None


def test_{{ func['name'] }}_with_invalid_input(mock_database):
    """Test {{ func['name'] }} with invalid input"""
    from {{ target_file.replace(".py", "").replace("/", ".") if target_file else "main" }} import {{ func['name'] }}

    # Arrange
    # Set up invalid test data

    # Act & Assert
    with pytest.raises(Exception):  # Replace with specific exception
        {{ func['name'] }}({% for arg in func['args'] %}invalid_arg_value{% if not loop.last %}, {% endif %}{% endfor %})  # Adjust based on actual function signature
{% endfor %}
{% else %}
def test_sample_unit_function(mock_service):
    """Test sample unit function"""
    # Replace with actual function tests
    assert True

def test_another_unit_function(mock_database):
    """Test another unit function"""
    # Replace with actual function tests
    assert True
{% endif %}

class TestUnitFunctions:
    """Unit tests for individual functions"""

    def test_sample_method(self, mock_service):
        """Test sample method"""
        # Replace with actual method tests
        assert True

    def test_edge_cases(self, mock_database):
        """Test edge cases"""
        # Add edge case tests
        assert True


if __name__ == "__main__":
    pytest.main([__file__])
'''

        template = Template(template_content)
        return template.render(target_file=target_file or "main", analyzed_code=analyzed_code)

    def _generate_integration_test(self, fastapi_app_path: str) -> str:
        """Generate integration tests for FastAPI endpoints"""
        template_content = '''import pytest
import json
from fastapi.testclient import TestClient

# Import fixtures
from .fixtures import *
from .conftest import *

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_item(client, sample_todo_data):
    """Test creating a new item"""
    response = client.post("/todos/", json=sample_todo_data)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["title"] == sample_todo_data["title"]


def test_get_item(client):
    """Test getting an item"""
    # First create an item
    sample_data = {{ "{{" }} "title": "Test Todo", "description": "Test description", "completed": False {{ "}}" }}
    create_response = client.post("/todos/", json=sample_data)
    assert create_response.status_code == 200
    item_id = create_response.json()["id"]

    # Then get the item
    response = client.get("/todos/" + str(item_id))
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item_id


def test_update_item(client, sample_todo_data):
    """Test updating an item"""
    # First create an item
    create_response = client.post("/todos/", json=sample_todo_data)
    assert create_response.status_code == 200
    item_id = create_response.json()["id"]

    # Then update the item
    update_data = {"title": "Updated Todo", "completed": True}
    response = client.put("/todos/" + str(item_id), json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Todo"
    assert data["completed"] == True


def test_delete_item(client, sample_todo_data):
    """Test deleting an item"""
    # First create an item
    create_response = client.post("/todos/", json=sample_todo_data)
    assert create_response.status_code == 200
    item_id = create_response.json()["id"]

    # Then delete the item
    response = client.delete("/todos/" + str(item_id))
    assert response.status_code == 200

    # Verify the item is deleted
    get_response = client.get("/todos/" + str(item_id))
    assert get_response.status_code == 404


def test_list_items(client, sample_todo_data):
    """Test listing items"""
    # Create multiple items
    for i in range(3):
        test_data = sample_todo_data.copy()
        test_data["title"] = "Test Todo " + str(i)
        response = client.post("/todos/", json=test_data)
        assert response.status_code == 200

    # Get the list
    response = client.get("/todos/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


def test_authentication_required_endpoint(client):
    """Test that protected endpoint requires authentication"""
    # Try to access protected endpoint without auth
    response = client.get("/protected-endpoint")
    assert response.status_code == 401  # Unauthorized

    # Try with valid auth token
    client.headers.update({{"Authorization": "Bearer valid-token"}})
    response = client.get("/protected-endpoint")
    assert response.status_code == 200


def test_error_handling(client):
    """Test error handling"""
    # Test with invalid data
    invalid_data = {{"invalid": "data"}}
    response = client.post("/todos/", json=invalid_data)
    assert response.status_code == 422  # Validation error


def test_rate_limiting(client, sample_todo_data):
    """Test rate limiting (if implemented)"""
    # Make multiple requests quickly
    for _ in range(10):
        response = client.post("/todos/", json=sample_todo_data)
        # Should not be rate limited for this test, but would be in production
        if response.status_code == 429:
            assert True  # Rate limit reached as expected
            break
    else:
        # If no rate limit was hit, that's also valid
        assert True


if __name__ == "__main__":
    pytest.main([__file__])
'''

        # Load template from file
        template_path = os.path.join(self.templates_dir, "integration_test.py.j2")
        with open(template_path, 'r') as f:
            template_content = f.read()

        template = Template(template_content)
        return template.render(fastapi_app_path=fastapi_app_path)

    def _generate_service_test(self, target_file: str, analyzed_code: Dict[str, Any]) -> str:
        """Generate service layer tests"""
        template_content = '''import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the parent directory to the path to import the target module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services import *  # Import your service modules
from models import *   # Import your models
from schemas import *  # Import your schemas

# Import fixtures
from .fixtures import *
from .conftest import *

class TestUserService:
    """Test user service functions"""

    def test_create_user(self, mock_database):
        """Test creating a user"""
        from services.user_service import create_user

        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword"
        }

        # Mock the database operations
        mock_database.add = Mock()
        mock_database.commit = Mock()
        mock_database.refresh = Mock()

        result = create_user(mock_database, user_data)

        # Verify the database was called correctly
        mock_database.add.assert_called_once()
        mock_database.commit.assert_called_once()

        # Verify the result
        assert result.username == user_data["username"]
        assert result.email == user_data["email"]

    def test_get_user(self, mock_database, mock_user):
        """Test getting a user"""
        from services.user_service import get_user

        # Mock the query
        mock_database.query.return_value.filter.return_value.first.return_value = mock_user

        result = get_user(mock_database, user_id=1)

        # Verify the query was called correctly
        mock_database.query.assert_called_once()
        assert result == mock_user

    def test_update_user(self, mock_database, mock_user):
        """Test updating a user"""
        from services.user_service import update_user

        update_data = {"username": "updateduser"}

        # Mock the query
        mock_database.query.return_value.filter.return_value.first.return_value = mock_user
        mock_database.add = Mock()
        mock_database.commit = Mock()

        result = update_user(mock_database, user_id=1, user_update=update_data)

        # Verify the update
        assert result.username == "updateduser"


class TestTodoService:
    """Test todo service functions"""

    def test_create_todo(self, mock_database, mock_user):
        """Test creating a todo"""
        from services.todo_service import create_todo

        todo_data = {
            "title": "Test Todo",
            "description": "Test description",
            "user_id": 1
        }

        # Mock the database operations
        mock_database.add = Mock()
        mock_database.commit = Mock()
        mock_database.refresh = Mock()

        result = create_todo(mock_database, todo_data, mock_user.id)

        # Verify the database was called correctly
        mock_database.add.assert_called_once()
        mock_database.commit.assert_called_once()

        # Verify the result
        assert result.title == todo_data["title"]
        assert result.user_id == mock_user.id

    def test_get_todos(self, mock_database, mock_todo):
        """Test getting todos"""
        from services.todo_service import get_todos

        # Mock the query result
        mock_database.query.return_value.filter.return_value.all.return_value = [mock_todo]

        results = get_todos(mock_database, user_id=1)

        # Verify the query was called and results returned
        mock_database.query.assert_called_once()
        assert len(results) == 1
        assert results[0] == mock_todo

    def test_update_todo_status(self, mock_database, mock_todo):
        """Test updating todo status"""
        from services.todo_service import update_todo_status

        # Mock the query
        mock_database.query.return_value.filter.return_value.first.return_value = mock_todo
        mock_database.add = Mock()
        mock_database.commit = Mock()

        result = update_todo_status(mock_database, todo_id=1, completed=True)

        # Verify the update
        assert result.completed == True


def test_service_error_handling(mock_database):
    """Test service error handling"""
    from services.user_service import get_user

    # Mock a database error
    mock_database.query.side_effect = Exception("Database error")

    with pytest.raises(Exception):
        get_user(mock_database, user_id=1)


def test_service_validation(mock_database):
    """Test service input validation"""
    from services.user_service import create_user

    # Test with invalid data
    invalid_data = {"username": ""}  # Invalid username

    with pytest.raises(ValueError):  # Or whatever validation error is appropriate
        create_user(mock_database, invalid_data)


if __name__ == "__main__":
    pytest.main([__file__])
'''

        template = Template(template_content)
        return template.render(target_file=target_file or "main")

    def _generate_database_test(self, database_url: str) -> str:
        """Generate database interaction tests"""
        template_content = '''import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from models import *  # Import your models
from database import Base

# Import fixtures
from .fixtures import *
from .conftest import *

def test_database_connection(db_session):
    """Test database connection"""
    # Execute a simple query to test connection
    result = db_session.execute(text("SELECT 1"))
    assert result.fetchone()[0] == 1


def test_user_model_creation(db_session):
    """Test creating and saving a user model"""
    from models.user_model import User  # Adjust import based on your model structure

    user = User(
        username="testuser",
        email="test@example.com",
        is_active=True
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.is_active == True


def test_todo_model_creation(db_session):
    """Test creating and saving a todo model"""
    from models.todo_model import Todo  # Adjust import based on your model structure

    todo = Todo(
        title="Test Todo",
        description="Test description",
        completed=False
    )

    db_session.add(todo)
    db_session.commit()
    db_session.refresh(todo)

    assert todo.id is not None
    assert todo.title == "Test Todo"
    assert todo.completed == False


def test_relationships(db_session):
    """Test model relationships"""
    from models.user_model import User
    from models.todo_model import Todo

    # Create a user
    user = User(
        username="testuser",
        email="test@example.com",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create a todo for the user
    todo = Todo(
        title="Test Todo",
        description="Test description",
        completed=False,
        user_id=user.id
    )
    db_session.add(todo)
    db_session.commit()
    db_session.refresh(todo)

    # Verify the relationship
    assert todo.user_id == user.id
    # If you have relationship defined, you can test it like:
    # assert todo.user == user


def test_database_query(db_session):
    """Test database queries"""
    from models.user_model import User

    # Create test users
    users = [
        User(username="user1", email="user1@example.com", is_active=True),
        User(username="user2", email="user2@example.com", is_active=True),
        User(username="user3", email="user3@example.com", is_active=False),
    ]

    for user in users:
        db_session.add(user)

    db_session.commit()

    # Query active users
    active_users = db_session.query(User).filter(User.is_active == True).all()
    assert len(active_users) == 2

    # Query by username
    user = db_session.query(User).filter(User.username == "user1").first()
    assert user is not None
    assert user.email == "user1@example.com"


def test_database_update(db_session):
    """Test database updates"""
    from models.user_model import User

    # Create a user
    user = User(
        username="testuser",
        email="test@example.com",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Update the user
    user.username = "updateduser"
    user.email = "updated@example.com"
    db_session.add(user)  # SQLAlchemy tracks changes automatically
    db_session.commit()

    # Verify the update
    updated_user = db_session.query(User).filter(User.id == user.id).first()
    assert updated_user.username == "updateduser"
    assert updated_user.email == "updated@example.com"


def test_database_delete(db_session):
    """Test database deletion"""
    from models.user_model import User

    # Create a user
    user = User(
        username="testuser",
        email="test@example.com",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    user_id = user.id

    # Delete the user
    db_session.delete(user)
    db_session.commit()

    # Verify the user is deleted
    deleted_user = db_session.query(User).filter(User.id == user_id).first()
    assert deleted_user is None


def test_database_rollback(db_session):
    """Test database transaction rollback"""
    from models.user_model import User

    initial_count = db_session.query(User).count()

    try:
        # Add a user
        user = User(username="rollback_test", email="rollback@example.com", is_active=True)
        db_session.add(user)
        db_session.flush()  # This will assign an ID but not commit

        # Verify the user is temporarily in the session
        temp_user = db_session.query(User).filter(User.username == "rollback_test").first()
        assert temp_user is not None

        # Raise an exception to trigger rollback
        raise Exception("Test rollback")
    except Exception:
        pass  # Exception was expected

    # After rollback, the user should not exist
    final_count = db_session.query(User).count()
    assert initial_count == final_count


def test_database_constraints(db_session):
    """Test database constraints"""
    from models.user_model import User

    # Test unique constraint
    user1 = User(username="duplicate", email="duplicate@example.com", is_active=True)
    db_session.add(user1)
    db_session.commit()

    # Try to create another user with same username
    user2 = User(username="duplicate", email="another@example.com", is_active=True)
    db_session.add(user2)

    with pytest.raises(Exception):  # Adjust based on your DB constraint exception type
        db_session.commit()
        db_session.flush()


def test_database_index_performance(db_session):
    """Test that database indexes work as expected"""
    from models.user_model import User
    import time

    # Create many users to test indexing
    for idx in range(100):
        user = User(
            username=f"perf_test_user_{idx}",
            email=f"perf{idx}@example.com",
            is_active=True
        )
        db_session.add(user)

    db_session.commit()

    # Time a query that should use an index
    start_time = time.time()
    result = db_session.query(User).filter(User.username == "perf_test_user_50").first()
    query_time = time.time() - start_time

    # Verify the result
    assert result is not None
    assert result.username == "perf_test_user_50"

    # Index queries should be fast (less than 100ms for this test)
    assert query_time < 0.1


if __name__ == "__main__":
    pytest.main([__file__])
'''

        template = Template(template_content)
        return template.render(database_url=database_url)

# For direct execution
if __name__ == "__main__":
    import sys
    import json

    # Read parameters from command line or stdin
    if len(sys.argv) > 1:
        params_str = sys.argv[1]
        params = json.loads(params_str)
    else:
        params_str = sys.stdin.read()
        params = json.loads(params_str)

    skill = FastAPITestingSkill()
    result = skill.execute(params)
    print(json.dumps(result))