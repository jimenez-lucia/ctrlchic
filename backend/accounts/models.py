import uuid

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

    # Mannequin image for virtual try-on
    mannequin_image_path = models.CharField(
        max_length=500, blank=True, null=True, help_text="Firebase Storage path for mannequin image"
    )
    mannequin_image_url = models.URLField(
        max_length=2048, blank=True, null=True, help_text="Public download URL for mannequin image"
    )
    mannequin_uploaded_at = models.DateTimeField(
        blank=True, null=True, help_text="When the mannequin image was last uploaded"
    )

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.email} ({self.firebase_uid})"


class WardrobeItem(models.Model):
    """
    Individual clothing items in user's wardrobe.
    Supports tops and bottoms categories with unlimited items.
    """

    CATEGORY_CHOICES = [
        ("top", "Top"),
        ("bottom", "Bottom"),
    ]

    # Auto-generated UUID for unique identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    user_profile = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name="wardrobe_items"
    )

    # Category
    category = models.CharField(
        max_length=10,
        choices=CATEGORY_CHOICES,
        db_index=True,
        help_text="Clothing category: top or bottom",
    )

    # Firebase Storage references
    image_path = models.CharField(
        max_length=500, help_text="Firebase Storage path for the item image"
    )
    image_url = models.URLField(max_length=2048, help_text="Signed download URL for the item image")

    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wardrobe_items"
        verbose_name = "Wardrobe Item"
        verbose_name_plural = "Wardrobe Items"
        indexes = [
            models.Index(fields=["user_profile", "category"]),
        ]
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.user_profile.user.email} - {self.category} - {self.id}"
