# Database Relationship Patterns

## SQL Relationships (SQLAlchemy)

### One-to-Many Relationship
```python
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base

class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)

    # One-to-Many: One author has many posts
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Author(id={self.id}, name='{self.name}')>"

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String)
    author_id = Column(Integer, ForeignKey("authors.id"), nullable=False)

    # Many-to-One: Many posts belong to one author
    author = relationship("Author", back_populates="posts")

    def __repr__(self):
        return f"<Post(id={self.id}, title='{self.title}')>"
```

### Many-to-Many Relationship
```python
from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base

# Association table for many-to-many relationship
post_tags = Table('post_tags',
    Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String)

    # Many-to-Many: Posts can have many tags, tags can be on many posts
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Many-to-Many: Tags can be on many posts, posts can have many tags
    posts = relationship("Post", secondary=post_tags, back_populates="tags")

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"
```

### One-to-One Relationship
```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)

    # One-to-One: One user has one profile
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    bio = Column(String)
    avatar_url = Column(String)

    # One-to-One: One profile belongs to one user
    user = relationship("User", back_populates="profile")
```

### Self-Referencing Relationship (Hierarchical Data)
```python
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"))

    # Self-referencing relationship for hierarchical categories
    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', parent_id={self.parent_id})>"
```

## Advanced Relationship Patterns

### Relationship with Additional Data
```python
# Association object pattern - when you need additional data on the relationship
class UserProject(Base):
    __tablename__ = "user_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    role = Column(String, nullable=False)  # 'admin', 'member', 'viewer'
    joined_date = Column(DateTime, default=func.current_timestamp())

    # Relationships
    user = relationship("User", back_populates="project_associations")
    project = relationship("Project", back_populates="user_associations")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)

    # Relationship through association object
    project_associations = relationship("UserProject", back_populates="user")
    projects = relationship("Project", secondary="user_projects", back_populates="users")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # Relationship through association object
    user_associations = relationship("UserProject", back_populates="project")
    users = relationship("User", secondary="user_projects", back_populates="projects")
```

### Polymorphic Relationships
```python
from sqlalchemy.ext.declarative import declared_attr

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.current_timestamp())

    # Polymorphic relationship - can comment on different entity types
    commentable_id = Column(Integer, nullable=False)
    commentable_type = Column(String, nullable=False)

    __table_args__ = (
        Index('ix_commentable', 'commentable_type', 'commentable_id'),
    )

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String)

    # Relationship to comments
    comments = relationship("Comment",
        primaryjoin="and_(Comment.commentable_id==Post.id, Comment.commentable_type=='post')",
        backref="post")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Integer)

    # Relationship to comments
    comments = relationship("Comment",
        primaryjoin="and_(Comment.commentable_id==Product.id, Comment.commentable_type=='product')",
        backref="product")
```

## MongoDB Relationships

### Referenced Relationships (Normalization)
```python
from odmantic import Model, Field, Reference
from datetime import datetime

class Author(Model):
    name: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        collection = "authors"

class Post(Model):
    title: str
    content: str
    # Reference to Author document
    author: Author = Field(reference=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        collection = "posts"
```

### Embedded Relationships (Denormalization)
```python
from odmantic import Model, Field, EmbeddedModel
from datetime import datetime
from typing import List

class Comment(EmbeddedModel):
    author: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Post(Model):
    title: str
    content: str
    # Embedded comments - all comments stored within the post document
    comments: List[Comment] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        collection = "posts"
```

### Hybrid Approach (Mixed Reference and Embedding)
```python
from odmantic import Model, Field, EmbeddedModel, Reference
from datetime import datetime
from typing import List, Optional

class AuthorSummary(EmbeddedModel):
    """Embedded summary of author to avoid extra lookup"""
    id: str
    name: str
    email: str

class Comment(EmbeddedModel):
    """Embedded comments for fast retrieval"""
    author: AuthorSummary
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Post(Model):
    title: str
    content: str
    # Embedded author summary for fast access
    author: AuthorSummary
    # Full author reference for detailed access when needed
    author_ref: str = Field(reference=True)
    # Embedded comments for performance
    comments: List[Comment] = []
    # Reference to related posts for complex relationships
    related_post_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        collection = "posts"
```

## Relationship Query Patterns

### SQL Query Patterns
```python
# Eager loading to avoid N+1 queries
from sqlalchemy.orm import joinedload, selectinload

# Using joinedload for simple relationships
users_with_posts = db.query(User).options(joinedload(User.posts)).all()

# Using selectinload for collections (more efficient for many records)
users_with_posts = db.query(User).options(selectinload(User.posts)).all()

# Complex query with multiple relationships
active_users_with_posts = db.query(User).options(
    selectinload(User.posts).selectinload(Post.tags)
).filter(User.is_active == True).all()

# Query with relationship conditions
users_with_published_posts = db.query(User).join(Post).filter(
    Post.status == 'published'
).options(selectinload(User.posts)).all()
```

### MongoDB Query Patterns
```python
# Using $lookup for joins in aggregation
pipeline = [
    {
        "$lookup": {
            "from": "authors",
            "localField": "author_ref",
            "foreignField": "_id",
            "as": "author_details"
        }
    },
    {
        "$unwind": "$author_details"
    },
    {
        "$project": {
            "title": 1,
            "content": 1,
            "author_name": "$author_details.name",
            "author_email": "$author_details.email"
        }
    }
]

posts_with_authors = await engine.find(Post, pipeline=pipeline)

# Using ODMantic relationships
# This will automatically fetch referenced documents
post = await engine.find_one(Post, Post.id == post_id)
author = post.author  # This will be the full Author object
```

## FastAPI Integration with Relationships

### SQL Relationships in FastAPI
```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from typing import List

app = FastAPI()

@app.get("/users/{user_id}/posts", response_model=List[PostResponse])
async def get_user_posts(
    user_id: int,
    db: Session = Depends(get_db)
):
    # Query user with posts loaded to avoid N+1 problem
    user = db.query(User).options(selectinload(User.posts)).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user.posts

@app.get("/posts/{post_id}", response_model=PostWithAuthorResponse)
async def get_post_with_author(
    post_id: int,
    db: Session = Depends(get_db)
):
    # Query post with author loaded
    post = db.query(Post).options(joinedload(Post.author)).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post
```

### MongoDB Relationships in FastAPI
```python
from fastapi import FastAPI, HTTPException
from typing import List

@app.get("/posts/{post_id}", response_model=PostResponse)
async def get_post_with_author(
    post_id: str,
    engine: AIOEngine = Depends(get_engine)
):
    # Fetch post with referenced author
    post = await engine.find_one(Post, Post.id == post_id)

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Author is automatically fetched due to reference field
    return post

@app.get("/authors/{author_id}/posts", response_model=List[PostResponse])
async def get_author_posts(
    author_id: str,
    engine: AIOEngine = Depends(get_engine)
):
    # Find posts by author reference
    posts = await engine.find(Post, Post.author_ref == author_id)
    return posts
```

## Performance Considerations

### SQL Relationship Optimization
```python
# Use proper indexing for foreign keys
Index('ix_posts_author_id', 'author_id')
Index('ix_post_tags_post_id', 'post_id')
Index('ix_post_tags_tag_id', 'tag_id')

# Consider when to use eager vs lazy loading
class Post(Base):
    # Lazy loading by default
    author = relationship("Author", back_populates="posts")

    # Eager loading for frequently accessed relationships
    tags = relationship("Tag", secondary=post_tags, back_populates="posts", lazy="selectin")

# Use explicit loading when needed
from sqlalchemy.orm import selectinload

def get_posts_with_authors(db: Session):
    return db.query(Post).options(selectinload(Post.author)).all()
```

### MongoDB Relationship Optimization
```python
# Use proper indexing for reference fields
class Post(Model):
    title: str
    author_ref: str = Field(reference=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        collection = "posts"
        indexes = [
            Index("author_ref"),  # Index on reference field
            Index("created_at"),
            Index([("author_ref", 1), ("created_at", -1)])  # Compound index
        ]

# Consider embedding vs referencing based on access patterns
# Embed when:
# - Data is always accessed together
# - Child data is small
# - Read operations are frequent

# Reference when:
# - Data is accessed independently
# - Child data is large
# - Write operations are frequent
# - Multiple parents need to reference the same child
```

## Relationship Validation

### SQL Relationship Constraints
```python
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    author_id = Column(Integer, ForeignKey("authors.id"), nullable=False)

    # Ensure referential integrity
    __table_args__ = (
        # Foreign key constraint with cascade options
        ForeignKeyConstraint(
            ['author_id'], ['authors.id'],
            ondelete="CASCADE",  # Delete posts when author is deleted
            onupdate="CASCADE"   # Update author_id when author.id changes
        ),
    )

# Alternative approach with relationship-level constraints
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    author_id = Column(Integer, ForeignKey("authors.id", ondelete="CASCADE"), nullable=False)

    author = relationship("Author", back_populates="posts")
```

### MongoDB Validation
```python
# Schema validation at database level
def setup_collection_validation():
    db.command(
        "collMod", "posts",
        validator={
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["title", "author_ref"],
                "properties": {
                    "title": {"bsonType": "string"},
                    "author_ref": {
                        "bsonType": "objectId",
                        "description": "Must be a valid ObjectId reference to authors collection"
                    }
                }
            }
        }
    )
```