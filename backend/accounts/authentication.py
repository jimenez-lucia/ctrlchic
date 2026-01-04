from typing import Optional

from django.conf import settings
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.http import HttpRequest
import firebase_admin
from firebase_admin import auth, credentials
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from .models import UserProfile


# Initialize Firebase Admin SDK (only once)
def _initialize_firebase() -> None:
    """Initialize Firebase Admin SDK if not already initialized."""
    if settings.FIREBASE_CREDENTIALS_PATH:
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
        except ValueError:
            # Not initialized yet, so initialize it
            try:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"Warning: Firebase Admin SDK initialization failed: {e}")


# Initialize on module import
_initialize_firebase()


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Firebase token authentication for Django REST Framework.

    Clients should authenticate by passing the Firebase ID token in the
    Authorization HTTP header, prepended with the string "Bearer ".

    Example: Authorization: Bearer <firebase_id_token>
    """

    def authenticate(self, request: HttpRequest) -> Optional[tuple[User, None]]:
        auth_header: str = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header:
            return None

        # Check if the header starts with 'Bearer '
        parts: list[str] = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token: str = parts[1]

        try:
            # Verify the Firebase ID token
            decoded_token: dict = auth.verify_id_token(token)
            firebase_uid: str = decoded_token["uid"]
            email: Optional[str] = decoded_token.get("email")

            # Get or create Django user
            user: User = self.get_or_create_user(firebase_uid, email)

            return (user, None)

        except auth.InvalidIdTokenError:
            raise AuthenticationFailed("Invalid Firebase ID token")
        except auth.ExpiredIdTokenError:
            raise AuthenticationFailed("Firebase ID token has expired")
        except Exception as e:
            raise AuthenticationFailed(f"Authentication failed: {str(e)}")

    def get_or_create_user(self, firebase_uid: str, email: Optional[str]) -> User:
        """
        Get or create a Django user based on Firebase UID.
        Handles race conditions when multiple requests try to create the same user.
        """
        try:
            # Try to get existing user profile
            profile: UserProfile = UserProfile.objects.select_related("user").get(
                firebase_uid=firebase_uid
            )
            return profile.user
        except UserProfile.DoesNotExist:
            # Create new Django user and profile
            if not email:
                raise AuthenticationFailed("Email is required for new users")

            try:
                # Use atomic transaction to ensure user + profile are created together
                with transaction.atomic():
                    # Create Django user
                    user: User = User.objects.create_user(
                        username=email,
                        email=email,
                    )

                    # Create user profile linked to Firebase UID
                    UserProfile.objects.create(user=user, firebase_uid=firebase_uid)

                    return user
            except IntegrityError:
                # Race condition: another request created this user simultaneously
                # Retry the get operation to fetch the user that was just created
                profile: UserProfile = UserProfile.objects.select_related("user").get(
                    firebase_uid=firebase_uid
                )
                return profile.user
