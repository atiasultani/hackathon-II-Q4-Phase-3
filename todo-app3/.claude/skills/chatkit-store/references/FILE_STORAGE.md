# File Storage Reference

## Storage Architecture

### Multi-Tier File Storage System
```python
import os
import boto3
import hashlib
from pathlib import Path
from typing import BinaryIO, Optional, Dict, Any
from datetime import datetime
import mimetypes
from urllib.parse import urlparse

class FileStorageManager:
    def __init__(self, config):
        self.config = config
        self.local_storage = LocalFileStorage(config.local_path)
        self.cloud_storage = S3FileStorage(
            config.aws_access_key,
            config.aws_secret_key,
            config.s3_bucket
        )

    def upload_file(self, file_obj: BinaryIO, filename: str, user_id: str) -> Dict[str, Any]:
        """Upload file with automatic tiering based on size"""
        file_size = self._get_file_size(file_obj)

        # Determine storage tier based on file size
        if file_size < self.config.small_file_threshold:
            # Store in local/fast storage
            storage_ref = self.local_storage.upload(file_obj, filename, user_id)
            tier = "hot"
        else:
            # Store in cloud/archive storage
            storage_ref = self.cloud_storage.upload(file_obj, filename, user_id)
            tier = "cold"

        return {
            "storage_id": storage_ref["id"],
            "url": storage_ref["url"],
            "size": file_size,
            "tier": tier,
            "upload_date": datetime.utcnow().isoformat()
        }

    def download_file(self, storage_id: str) -> BinaryIO:
        """Download file with automatic promotion from cold storage"""
        # Check if file exists in hot storage
        try:
            return self.local_storage.download(storage_id)
        except FileNotFoundError:
            # File not in hot storage, try cold storage
            file_data = self.cloud_storage.download(storage_id)
            # Promote to hot storage for faster access next time
            self.local_storage.cache_remotely_fetched_file(file_data, storage_id)
            return file_data

    def _get_file_size(self, file_obj: BinaryIO) -> int:
        """Get file size without changing position"""
        current_pos = file_obj.tell()
        file_obj.seek(0, 2)  # Seek to end
        size = file_obj.tell()
        file_obj.seek(current_pos)  # Restore position
        return size
```

### Local File Storage Implementation
```python
import uuid
import shutil
from pathlib import Path
from typing import BinaryIO, Dict, Any

class LocalFileStorage:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def upload(self, file_obj: BinaryIO, original_filename: str, user_id: str) -> Dict[str, Any]:
        """Upload file to local storage with user-based organization"""
        # Create user-specific directory
        user_dir = self.base_path / user_id[:2] / user_id[2:4] / user_id
        user_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_ext = Path(original_filename).suffix
        storage_id = str(uuid.uuid4())
        storage_filename = f"{storage_id}{file_ext}"
        file_path = user_dir / storage_filename

        # Save file
        with open(file_path, 'wb') as dest:
            shutil.copyfileobj(file_obj, dest)

        return {
            "id": storage_id,
            "url": f"/uploads/{user_dir.name}/{storage_filename}",
            "path": str(file_path)
        }

    def download(self, storage_id: str) -> BinaryIO:
        """Download file from local storage"""
        # Find file by storage ID (would require search in real implementation)
        for root, dirs, files in os.walk(self.base_path):
            for file in files:
                if storage_id in file:
                    file_path = Path(root) / file
                    return open(file_path, 'rb')

        raise FileNotFoundError(f"File with ID {storage_id} not found")

    def delete(self, storage_id: str):
        """Delete file from local storage"""
        # Implementation to find and delete file by ID
        pass

    def get_metadata(self, storage_id: str) -> Dict[str, Any]:
        """Get file metadata"""
        # Implementation to retrieve file metadata
        pass
```

### Cloud Storage (S3) Implementation
```python
import boto3
from botocore.exceptions import ClientError
from io import BytesIO
from typing import BinaryIO, Dict, Any

class S3FileStorage:
    def __init__(self, aws_access_key: str, aws_secret_key: str, bucket_name: str):
        self.bucket_name = bucket_name
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key
        )

    def upload(self, file_obj: BinaryIO, original_filename: str, user_id: str) -> Dict[str, Any]:
        """Upload file to S3 with proper metadata"""
        storage_id = str(uuid.uuid4())

        # Create S3 key with user-based organization
        s3_key = f"{user_id}/{storage_id}_{original_filename}"

        # Upload file
        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': self._get_content_type(original_filename),
                    'Metadata': {
                        'user_id': user_id,
                        'original_filename': original_filename
                    }
                }
            )

            return {
                "id": storage_id,
                "url": f"s3://{self.bucket_name}/{s3_key}",
                "s3_key": s3_key
            }
        except ClientError as e:
            raise Exception(f"S3 upload failed: {str(e)}")

    def download(self, storage_id: str) -> BinaryIO:
        """Download file from S3"""
        # This would require storing the S3 key with the storage ID
        # In a real implementation, you'd have a mapping table
        raise NotImplementedError("S3 download requires storage key mapping")

    def generate_presigned_url(self, storage_id: str, expiration: int = 3600) -> str:
        """Generate presigned URL for secure file access"""
        s3_key = self._get_s3_key_for_storage_id(storage_id)

        return self.s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket_name, 'Key': s3_key},
            ExpiresIn=expiration
        )

    def _get_content_type(self, filename: str) -> str:
        """Determine content type from filename"""
        content_type, _ = mimetypes.guess_type(filename)
        return content_type or 'application/octet-stream'

    def _get_s3_key_for_storage_id(self, storage_id: str) -> str:
        """Map storage ID to S3 key (implementation would use database lookup)"""
        # This would typically involve a database lookup
        # For demo purposes, we'll assume a simple pattern
        return f"files/{storage_id}.dat"
```

## File Processing Pipelines

### Image Processing Pipeline
```python
from PIL import Image
import io
from typing import BinaryIO, Tuple

class ImageProcessor:
    def __init__(self, max_size: Tuple[int, int] = (1920, 1080)):
        self.max_size = max_size

    def process_image_upload(self, image_file: BinaryIO, quality: int = 85) -> Dict[str, BinaryIO]:
        """Process image with resizing and thumbnail generation"""
        image = Image.open(image_file)

        # Resize main image if too large
        if image.width > self.max_size[0] or image.height > self.max_size[1]:
            image.thumbnail(self.max_size, Image.Resampling.LANCZOS)

        # Create main image buffer
        main_buffer = io.BytesIO()
        image.save(main_buffer, format=image.format, quality=quality, optimize=True)
        main_buffer.seek(0)

        # Generate thumbnail
        thumbnail = image.copy()
        thumbnail.thumbnail((200, 200), Image.Resampling.LANCZOS)
        thumb_buffer = io.BytesIO()
        thumbnail.save(thumb_buffer, format=image.format, quality=70, optimize=True)
        thumb_buffer.seek(0)

        return {
            "main": main_buffer,
            "thumbnail": thumb_buffer
        }

    def validate_image(self, image_file: BinaryIO) -> bool:
        """Validate image file format and size"""
        try:
            image = Image.open(image_file)
            # Check if format is supported
            if image.format not in ['JPEG', 'PNG', 'GIF', 'WEBP']:
                return False

            # Check dimensions
            if image.width > 10000 or image.height > 10000:
                return False

            return True
        except:
            return False
```

### File Security and Validation
```python
import magic
import hashlib
from typing import BinaryIO

class FileValidator:
    def __init__(self, allowed_types: list, max_size: int):
        self.allowed_types = allowed_types
        self.max_size = max_size
        self.magic = magic.Magic(mime=True)

    def validate_file(self, file_obj: BinaryIO, original_filename: str) -> Dict[str, Any]:
        """Validate file type, size, and content"""
        # Check file size
        file_obj.seek(0, 2)  # Seek to end
        file_size = file_obj.tell()
        file_obj.seek(0)  # Reset position

        if file_size > self.max_size:
            raise ValueError(f"File too large: {file_size} bytes, max: {self.max_size}")

        # Check file extension
        file_ext = Path(original_filename).suffix.lower()
        if file_ext not in self.allowed_extensions:
            raise ValueError(f"File type not allowed: {file_ext}")

        # Check actual file content (magic bytes)
        file_content = file_obj.read(2048)  # Read first 2KB for detection
        file_obj.seek(0)  # Reset position

        detected_mime = self.magic.from_buffer(file_content)

        if detected_mime not in self.allowed_types:
            raise ValueError(f"File content type not allowed: {detected_mime}")

        # Calculate hash for integrity
        file_obj.seek(0)
        file_hash = hashlib.sha256()
        while chunk := file_obj.read(8192):
            file_hash.update(chunk)
        file_obj.seek(0)  # Reset position

        return {
            "size": file_size,
            "mime_type": detected_mime,
            "extension": file_ext,
            "hash": file_hash.hexdigest()
        }
```

## File Access Control

### Secure File Serving
```python
from flask import Flask, send_file, abort
import jwt
from functools import wraps

app = Flask(__name__)

def require_file_access_token(f):
    """Decorator to require valid access token for file access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token:
            abort(401, "Access token required")

        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user_id = payload['user_id']
            file_id = payload['file_id']

            # Verify user has access to this file
            if not user_has_access_to_file(user_id, file_id):
                abort(403, "Access denied")

        except jwt.InvalidTokenError:
            abort(401, "Invalid token")

        return f(*args, **kwargs)
    return decorated_function

@app.route('/secure-file/<file_id>')
@require_file_access_token
def serve_secure_file(file_id):
    """Serve file with access control"""
    try:
        file_stream = storage_manager.download(file_id)
        return send_file(file_stream, as_attachment=True)
    except FileNotFoundError:
        abort(404, "File not found")
```

## File Lifecycle Management

### File Expiration and Cleanup
```python
import schedule
import time
from datetime import datetime, timedelta

class FileLifecycleManager:
    def __init__(self, db_connection, storage_manager):
        self.db = db_connection
        self.storage = storage_manager

    def schedule_cleanup_jobs(self):
        """Schedule regular cleanup jobs"""
        # Daily cleanup of temporary files
        schedule.every().day.at("02:00").do(self.cleanup_temporary_files)

        # Weekly cleanup of old attachments
        schedule.every().monday.at("01:00").do(self.cleanup_old_attachments)

        # Monthly archive of infrequently accessed files
        schedule.every().month.do(self.archive_inactive_files)

    def cleanup_temporary_files(self):
        """Remove temporary files older than 24 hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=24)

        temp_files = self.db.query("""
            SELECT storage_id, created_at
            FROM files
            WHERE is_temporary = true
            AND created_at < %s
        """, (cutoff_time,))

        for file_record in temp_files:
            try:
                self.storage.delete(file_record['storage_id'])
                self.db.execute("""
                    DELETE FROM files WHERE storage_id = %s
                """, (file_record['storage_id'],))
            except Exception as e:
                print(f"Failed to delete temp file {file_record['storage_id']}: {e}")

    def archive_inactive_files(self):
        """Move infrequently accessed files to cheaper storage"""
        cutoff_time = datetime.utcnow() - timedelta(days=90)
        low_usage_threshold = 1  # Accessed less than once per month

        inactive_files = self.db.query("""
            SELECT f.storage_id, f.access_count, f.last_accessed
            FROM files f
            LEFT JOIN access_logs al ON f.storage_id = al.file_id
            WHERE f.last_accessed < %s
            AND f.tier = 'hot'
            AND f.access_count < %s
        """, (cutoff_time, low_usage_threshold))

        for file_record in inactive_files:
            try:
                # Move file to cold storage
                self.storage.move_to_archive(file_record['storage_id'])
                # Update tier in database
                self.db.execute("""
                    UPDATE files SET tier = 'cold' WHERE storage_id = %s
                """, (file_record['storage_id'],))
            except Exception as e:
                print(f"Failed to archive file {file_record['storage_id']}: {e}")
```