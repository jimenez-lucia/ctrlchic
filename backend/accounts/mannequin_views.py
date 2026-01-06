"""Views for mannequin image upload and management."""

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import UserProfile
from .storage import (
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    delete_file,
    file_exists,
    generate_mannequin_path,
    get_download_url,
    get_signed_upload_url,
    validate_file_extension,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_upload_url(request: Request) -> Response:
    """
    Get a signed URL for direct client-side upload to Firebase Storage.

    Request body:
        {
            "filename": "photo.jpg",
            "contentType": "image/jpeg",
            "fileSize": 1234567  // bytes
        }

    Returns:
        {
            "uploadUrl": "https://storage.googleapis.com/...",
            "filePath": "users/abc123/mannequin"
        }
    """
    user: User = request.user

    # Validate request data
    filename = request.data.get("filename")
    content_type = request.data.get("contentType")
    file_size = request.data.get("fileSize")

    if not all([filename, content_type, file_size]):
        return Response(
            {"error": "filename, contentType, and fileSize are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file extension
    is_valid, _ = validate_file_extension(filename)
    if not is_valid:
        return Response(
            {"error": f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"},
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

    # Validate content type (using standard MIME types only)
    valid_content_types = {
        "image/jpeg",  # Standard MIME type for JPEG/JPG files
        "image/png",
        "image/heic",
        "image/heif",
        "image/webp",
    }
    if content_type not in valid_content_types:
        return Response(
            {"error": f"Invalid content type. Must be one of: {', '.join(valid_content_types)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Generate storage path
    firebase_uid = user.profile.firebase_uid
    file_path = generate_mannequin_path(firebase_uid)

    # Get signed upload URL
    try:
        upload_url = get_signed_upload_url(file_path, content_type)
    except Exception as e:
        return Response(
            {"error": f"Failed to generate upload URL: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"uploadUrl": upload_url, "filePath": file_path})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_upload(request: Request) -> Response:
    """
    Confirm that the file was uploaded successfully.
    Updates the user profile with the file path and download URL.

    Request body:
        {
            "filePath": "users/abc123/mannequin"
        }

    Returns:
        {
            "success": true,
            "url": "https://storage.googleapis.com/...",
            "uploadedAt": "2024-01-04T12:00:00Z"
        }
    """
    user: User = request.user
    file_path = request.data.get("filePath")

    if not file_path:
        return Response({"error": "filePath is required"}, status=status.HTTP_400_BAD_REQUEST)

    # SECURITY: Verify the filePath belongs to this user
    # This prevents users from confirming uploads to other users' paths
    expected_path = generate_mannequin_path(user.profile.firebase_uid)
    if file_path != expected_path:
        return Response(
            {"error": "Invalid filePath. Path does not belong to authenticated user."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Verify the file exists in storage
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

    # Update user profile
    profile: UserProfile = user.profile
    profile.mannequin_image_path = file_path
    profile.mannequin_image_url = download_url
    profile.mannequin_uploaded_at = timezone.now()
    profile.save()

    return Response(
        {
            "success": True,
            "url": download_url,
            "uploadedAt": profile.mannequin_uploaded_at.isoformat(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_mannequin(request: Request) -> Response:
    """
    Get the current mannequin image for the authenticated user.

    Returns:
        {
            "url": "https://storage.googleapis.com/...",
            "uploadedAt": "2024-01-04T12:00:00Z"
        }

        Or if no image:
        {
            "url": null,
            "uploadedAt": null
        }
    """
    user: User = request.user
    profile: UserProfile = user.profile

    if not profile.mannequin_image_path:
        return Response({"url": None, "uploadedAt": None})

    # Refresh download URL (they expire after 7 days)
    # Regenerate on every request to ensure URL is always valid
    try:
        download_url = get_download_url(profile.mannequin_image_path)
        if not download_url:
            # File no longer exists in storage
            return Response(
                {"error": "Mannequin image not found in storage"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Update cached URL if it changed
        if download_url != profile.mannequin_image_url:
            profile.mannequin_image_url = download_url
            profile.save()

    except Exception as e:
        # Don't silently fall back to potentially expired cached URL
        # Return error so frontend knows to handle it
        return Response(
            {"error": f"Failed to generate download URL: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "url": download_url,
            "uploadedAt": (
                profile.mannequin_uploaded_at.isoformat() if profile.mannequin_uploaded_at else None
            ),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_mannequin(request: Request) -> Response:
    """
    Delete the mannequin image for the authenticated user.

    Returns:
        {
            "success": true,
            "message": "Mannequin image deleted successfully"
        }
    """
    user: User = request.user
    profile: UserProfile = user.profile

    if not profile.mannequin_image_path:
        return Response({"error": "No mannequin image to delete"}, status=status.HTTP_404_NOT_FOUND)

    # Delete from Firebase Storage
    try:
        deleted = delete_file(profile.mannequin_image_path)
        if not deleted:
            # File didn't exist in storage, but clear DB reference anyway
            pass
    except Exception as e:
        return Response(
            {"error": f"Failed to delete file from storage: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Clear database references
    profile.mannequin_image_path = None
    profile.mannequin_image_url = None
    profile.mannequin_uploaded_at = None
    profile.save()

    return Response({"success": True, "message": "Mannequin image deleted successfully"})
