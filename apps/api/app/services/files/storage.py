import os
import io
from typing import Protocol
from minio import Minio
from minio.error import S3Error
from loguru import logger
from app.core.config import settings

class StorageProvider(Protocol):
    def upload_file(self, file_data: bytes, object_name: str, content_type: str) -> str: ...
    def get_file(self, object_name: str) -> bytes: ...

class MinIOStorageProvider:
    def __init__(self):
        self.endpoint = settings.MINIO_ENDPOINT
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.bucket = settings.MINIO_BUCKET
        self.secure = settings.MINIO_USE_SSL

        try:
            self.client = Minio(
                endpoint=self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure
            )
            self._ensure_bucket()
        except Exception as e:
            logger.warning(f"MinIO client init warning: {e}. Using local storage fallback.")
            self.client = None
            self.fallback_dir = "/tmp/suprai_storage"
            os.makedirs(self.fallback_dir, exist_ok=True)

    def _ensure_bucket(self):
        if self.client and not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
            logger.info(f"Created MinIO bucket: {self.bucket}")

    def upload_file(self, file_data: bytes, object_name: str, content_type: str) -> str:
        if self.client:
            try:
                self.client.put_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    data=io.BytesIO(file_data),
                    length=len(file_data),
                    content_type=content_type
                )
                return object_name
            except Exception as e:
                logger.error(f"Failed to upload to MinIO: {e}, storing locally")
        
        # Fallback local upload
        local_path = os.path.join("/tmp/suprai_storage", object_name)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file_data)
        return object_name

    def get_file(self, object_name: str) -> bytes:
        if self.client:
            try:
                response = self.client.get_object(self.bucket, object_name)
                return response.read()
            except Exception as e:
                logger.warning(f"MinIO read failed: {e}")

        # Fallback local read
        local_path = os.path.join("/tmp/suprai_storage", object_name)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()
        return b""

storage_service = MinIOStorageProvider()
