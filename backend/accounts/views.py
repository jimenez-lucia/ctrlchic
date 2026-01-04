from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from django.contrib.auth.models import User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request: Request) -> Response:
    """
    Get the current authenticated user's information.
    Requires Firebase authentication token.
    """
    user: User = request.user

    return Response({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'firebase_uid': user.profile.firebase_uid,
        'date_joined': user.date_joined.isoformat(),
    })


@api_view(['GET'])
def auth_test(request: Request) -> Response:
    """
    Test endpoint to check if authentication is working.
    Returns different responses based on authentication status.
    """
    if request.user and request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'firebase_uid': request.user.profile.firebase_uid,
            }
        })
    else:
        return Response({
            'authenticated': False,
            'message': 'No authentication credentials provided'
        })
