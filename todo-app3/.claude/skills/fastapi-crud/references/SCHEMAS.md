# Pydantic Schema Best Practices

## Basic Schema Definition

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Enables ORM mode
```

## Validation Patterns

### Field Validation
```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class Product(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    category: str = Field(..., pattern=r'^[a-zA-Z_][a-zA-Z0-9_]*$')
    stock: int = Field(..., ge=0, le=10000)
    description: Optional[str] = Field(None, max_length=1000)
```

### Custom Validators
```python
class User(BaseModel):
    name: str
    age: int
    email: str

    @validator('age')
    def age_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Age must be positive')
        return v

    @validator('email')
    def email_must_be_valid(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v
```

### Root Validators
```python
from pydantic import BaseModel, root_validator

class Event(BaseModel):
    start_time: datetime
    end_time: datetime

    @root_validator
    def check_time_order(cls, values):
        if 'start_time' in values and 'end_time' in values:
            if values['start_time'] >= values['end_time']:
                raise ValueError('End time must be after start time')
        return values
```

## Nested Models

```python
class Address(BaseModel):
    street: str
    city: str
    country: str
    zip_code: str

class UserWithAddress(BaseModel):
    id: int
    name: str
    email: str
    address: Address

    class Config:
        from_attributes = True
```

## Generic Types

```python
from typing import List, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
```

## Error Handling

```python
from pydantic import ValidationError

try:
    user = UserCreate(name="John", email="invalid-email")
except ValidationError as e:
    print(e.json())
```

## Serialization Options

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str
    password: str

    class Config:
        from_attributes = True
        # Exclude sensitive fields from serialization
        fields = {
            'password': {'write_only': True}
        }

# Usage
user_dict = user.dict(exclude={'password'})  # Exclude password field
```

## Schema Inheritance

```python
class BaseModel(BaseModel):
    id: int
    created_at: datetime

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```