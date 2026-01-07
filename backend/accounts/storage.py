"""Firebase Storage utilities for handling file uploads."""

from datetime import timedelta
import re
from typing import Optional
import uuid

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


def validate_firebase_uid(firebase_uid: str) -> bool:
    """
    Validate Firebase UID format to prevent path traversal attacks.

    Firebase UIDs are alphanumeric strings. This validation ensures
    the UID doesn't contain path traversal sequences like '../' or other
    potentially dangerous characters.

    Args:
        firebase_uid: The Firebase UID to validate

    Returns:
        True if valid, False otherwise
    """
    if not firebase_uid:
        return False

    # Firebase UIDs are alphanumeric (can include letters, numbers, hyphens, underscores)
    # Typical length is 28 characters but can vary
    # Pattern ensures no path traversal characters (/, \, ., :, etc.)
    pattern = r"^[a-zA-Z0-9_-]+$"
    return bool(re.match(pattern, firebase_uid)) and len(firebase_uid) > 0


def generate_mannequin_path(firebase_uid: str) -> str:
    """
    Generate storage path for mannequin image.
    Always uses the same path - new uploads overwrite the old one.

    Args:
        firebase_uid: User's Firebase UID

    Returns:
        Storage path like 'users/{firebase_uid}/mannequin'

    Raises:
        ValueError: If firebase_uid contains invalid characters (potential path traversal)
    """
    # SECURITY: Validate firebase_uid to prevent path traversal attacks
    if not validate_firebase_uid(firebase_uid):
        raise ValueError(
            f"Invalid firebase_uid format. UID must be alphanumeric and cannot contain "
            f"path traversal characters. Received: {firebase_uid!r}"
        )

    return f"users/{firebase_uid}/mannequin"


def generate_wardrobe_item_path(
    firebase_uid: str, category: str, item_id: str, extension: str
) -> str:
    """
    Generate storage path for wardrobe item.

    Args:
        firebase_uid: User's Firebase UID
        category: 'top' or 'bottom'
        item_id: UUID string for the item
        extension: File extension (jpg, png, etc.)

    Returns:
        Storage path like 'users/{uid}/wardrobe/{category}s/{uuid}.ext'

    Raises:
        ValueError: If any parameter contains invalid characters
    """
    # SECURITY: Validate all inputs to prevent path traversal
    if not validate_firebase_uid(firebase_uid):
        raise ValueError(f"Invalid firebase_uid format: {firebase_uid!r}")

    # Validate category
    if category not in ["top", "bottom"]:
        raise ValueError(f"Invalid category. Must be 'top' or 'bottom', got: {category!r}")

    # Validate UUID format
    try:
        uuid.UUID(item_id)
    except ValueError:
        raise ValueError(f"Invalid UUID format: {item_id!r}")

    # Validate extension
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError(f"Invalid extension: {extension!r}")

    # Pluralize category for storage path (top -> tops, bottom -> bottoms)
    category_plural = f"{category}s"

    return f"users/{firebase_uid}/wardrobe/{category_plural}/{item_id}.{extension}"


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
