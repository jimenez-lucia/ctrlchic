from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    """
    Extended user profile linked to Firebase Auth.
    The firebase_uid is the unique identifier from Firebase Authentication.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    firebase_uid = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.email} ({self.firebase_uid})"
