"""Views for wardrobe item upload and management."""

import uuid

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import WardrobeItem
from .storage import (
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    delete_file,
    file_exists,
    generate_wardrobe_item_path,
    get_download_url,
    get_signed_upload_url,
    validate_file_extension,
)

VALID_CATEGORIES = ["top", "bottom"]


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_upload_url(request: Request) -> Response:
    """
    Get signed URL for wardrobe item upload.

    Request body:
        {
            "category": "top",
            "filename": "shirt.jpg",
            "contentType": "image/jpeg",
            "fileSize": 1234567
        }

    Returns:
        {
            "uploadUrl": "https://storage.googleapis.com/...",
            "itemId": "550e8400-e29b-41d4-a716-446655440000",
            "filePath": "users/abc123/wardrobe/tops/550e8400-..."
        }
    """
    user: User = request.user

    # Validate request data
    category = request.data.get("category")
    filename = request.data.get("filename")
    content_type = request.data.get("contentType")
    file_size = request.data.get("fileSize")

    if not all([category, filename, content_type, file_size]):
        return Response(
            {"error": "category, filename, contentType, and fileSize are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate category
    if category not in VALID_CATEGORIES:
        return Response(
            {"error": f'Invalid category. Must be one of: {", ".join(VALID_CATEGORIES)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file extension
    is_valid, extension = validate_file_extension(filename)
    if not is_valid:
        return Response(
            {"error": f'Invalid file type. Allowed types: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file size
    try:
        file_size_int = int(file_size)
        if file_size_int > MAX_FILE_SIZE_BYTES:
            return Response(
                {"error": f"File size must be less than {MAX_FILE_SIZE_MB}MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, TypeError):
        return Response({"error": "Invalid fileSize value"}, status=status.HTTP_400_BAD_REQUEST)

    # Validate content type
    valid_content_types = {
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/heif",
        "image/webp",
    }
    if content_type not in valid_content_types:
        return Response(
            {"error": f'Invalid content type. Must be one of: {", ".join(valid_content_types)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Generate new UUID for item
    item_id = uuid.uuid4()

    # Generate storage path
    firebase_uid = user.profile.firebase_uid
    try:
        file_path = generate_wardrobe_item_path(firebase_uid, category, str(item_id), extension)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Get signed upload URL
    try:
        upload_url = get_signed_upload_url(file_path, content_type)
    except Exception as e:
        return Response(
            {"error": f"Failed to generate upload URL: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"uploadUrl": upload_url, "itemId": str(item_id), "filePath": file_path})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_upload(request: Request) -> Response:
    """
    Confirm wardrobe item upload and create database record.

    Request body:
        {
            "itemId": "550e8400-e29b-41d4-a716-446655440000",
            "filePath": "users/abc123/wardrobe/tops/550e8400-..."
        }

    Returns:
        {
            "success": true,
            "item": {
                "id": "550e8400-...",
                "category": "top",
                "url": "https://storage.googleapis.com/...",
                "uploadedAt": "2024-01-06T12:00:00Z"
            }
        }
    """
    user: User = request.user

    item_id_str = request.data.get("itemId")
    file_path = request.data.get("filePath")

    if not all([item_id_str, file_path]):
        return Response(
            {"error": "itemId and filePath are required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Validate UUID format
    try:
        item_id = uuid.UUID(item_id_str)
    except ValueError:
        return Response({"error": "Invalid itemId format"}, status=status.HTTP_400_BAD_REQUEST)

    # SECURITY: Verify filePath belongs to this user
    if not file_path.startswith(f"users/{user.profile.firebase_uid}/wardrobe/"):
        return Response(
            {"error": "Invalid filePath. Path does not belong to authenticated user."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Extract category from path
    path_parts = file_path.split("/")
    if len(path_parts) < 4:
        return Response({"error": "Invalid filePath format"}, status=status.HTTP_400_BAD_REQUEST)

    category_plural = path_parts[3]  # tops or bottoms
    category = category_plural.rstrip("s")  # top or bottom

    if category not in VALID_CATEGORIES:
        return Response(
            {"error": "Invalid category in filePath"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Verify file exists in storage
    if not file_exists(file_path):
        return Response(
            {"error": "File not found in storage. Upload may have failed."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Get download URL
    try:
        download_url = get_download_url(file_path)
        if not download_url:
            return Response(
                {"error": "Failed to generate download URL"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    except Exception as e:
        return Response(
            {"error": f"Failed to get download URL: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Create wardrobe item record
    wardrobe_item = WardrobeItem.objects.create(
        id=item_id,
        user_profile=user.profile,
        category=category,
        image_path=file_path,
        image_url=download_url,
    )

    return Response(
        {
            "success": True,
            "item": {
                "id": str(wardrobe_item.id),
                "category": wardrobe_item.category,
                "url": wardrobe_item.image_url,
                "uploadedAt": wardrobe_item.uploaded_at.isoformat(),
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_items(request: Request) -> Response:
    """
    List wardrobe items, optionally filtered by category.

    Query parameters:
        category (optional): "top" or "bottom"

    Returns:
        {
            "items": [
                {
                    "id": "550e8400-...",
                    "category": "top",
                    "url": "https://storage.googleapis.com/...",
                    "uploadedAt": "2024-01-06T12:00:00Z"
                }
            ],
            "count": 1
        }
    """
    user: User = request.user

    # Get optional category filter
    category = request.query_params.get("category")

    # Build query
    items = WardrobeItem.objects.filter(user_profile=user.profile)

    if category:
        if category not in VALID_CATEGORIES:
            return Response(
                {"error": f'Invalid category. Must be one of: {", ".join(VALID_CATEGORIES)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        items = items.filter(category=category)

    # Refresh URLs and serialize
    items_data = []
    for item in items:
        # Regenerate download URL (they expire after 7 days)
        try:
            fresh_url = get_download_url(item.image_path)
            if fresh_url and fresh_url != item.image_url:
                item.image_url = fresh_url
                item.save()

            items_data.append(
                {
                    "id": str(item.id),
                    "category": item.category,
                    "url": item.image_url,
                    "uploadedAt": item.uploaded_at.isoformat(),
                }
            )
        except Exception as e:
            # Log error but continue with other items
            print(f"Error refreshing URL for item {item.id}: {e}")
            continue

    return Response({"items": items_data, "count": len(items_data)})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_item(request: Request, item_id: str) -> Response:
    """
    Delete specific wardrobe item.

    Returns:
        {
            "success": true,
            "message": "Item deleted successfully"
        }
    """
    user: User = request.user

    # Validate UUID format
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        return Response({"error": "Invalid item ID format"}, status=status.HTTP_400_BAD_REQUEST)

    # Get item and verify ownership
    try:
        item = WardrobeItem.objects.get(id=item_uuid, user_profile=user.profile)
    except WardrobeItem.DoesNotExist:
        return Response(
            {"error": "Item not found or does not belong to user"}, status=status.HTTP_404_NOT_FOUND
        )

    # Delete from Firebase Storage
    try:
        delete_file(item.image_path)
    except Exception as e:
        # Log but don't fail - continue with DB deletion
        print(f"Error deleting file from storage: {e}")

    # Delete database record
    item.delete()

    return Response({"success": True, "message": "Item deleted successfully"})
