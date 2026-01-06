"""Firebase Storage utilities for handling file uploads."""

from datetime import timedelta
from typing import Optional

from firebase_admin import storage

# Allowed image file extensions
ALLOWED_IMAGE_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "heic",
    "heif",
    "webp",
}

# Max file size: 10MB
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def get_storage_bucket():
    """Get Firebase Storage bucket instance."""
    return storage.bucket()


def generate_mannequin_path(firebase_uid: str) -> str:
    """
    Generate storage path for mannequin image.
    Always uses the same path - new uploads overwrite the old one.

    Args:
        firebase_uid: User's Firebase UID

    Returns:
        Storage path like 'users/{firebase_uid}/mannequin'
    """
    return f"users/{firebase_uid}/mannequin"


def validate_file_extension(filename: str) -> tuple[bool, Optional[str]]:
    """
    Validate file extension.

    Args:
        filename: Name of the file

    Returns:
        Tuple of (is_valid, extension or None)
    """
    if "." not in filename:
        return False, None

    extension = filename.rsplit(".", 1)[1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return False, None

    return True, extension


def get_signed_upload_url(file_path: str, content_type: str) -> str:
    """
    Generate a signed URL for direct client upload to Firebase Storage.

    Args:
        file_path: Storage path for the file
        content_type: MIME type (e.g., 'image/jpeg')

    Returns:
        Signed URL that client can PUT to
    """
    bucket = get_storage_bucket()
    blob = bucket.blob(file_path)

    # Set content type as metadata
    blob.content_type = content_type

    # Generate signed URL valid for 15 minutes
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="PUT",
        content_type=content_type,
    )

    return url


def get_download_url(file_path: str) -> Optional[str]:
    """
    Get public download URL for a file.

    Args:
        file_path: Storage path for the file

    Returns:
        Public download URL or None if file doesn't exist
    """
    bucket = get_storage_bucket()
    blob = bucket.blob(file_path)

    if not blob.exists():
        return None

    # Generate signed URL valid for 7 days
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(days=7),
        method="GET",
    )

    return url


def delete_file(file_path: str) -> bool:
    """
    Delete a file from Firebase Storage.

    Args:
        file_path: Storage path for the file

    Returns:
        True if deleted, False if file didn't exist
    """
    bucket = get_storage_bucket()
    blob = bucket.blob(file_path)

    if not blob.exists():
        return False

    blob.delete()
    return True


def file_exists(file_path: str) -> bool:
    """
    Check if a file exists in Firebase Storage.

    Args:
        file_path: Storage path for the file

    Returns:
        True if file exists, False otherwise
    """
    bucket = get_storage_bucket()
    blob = bucket.blob(file_path)
    return blob.exists()
