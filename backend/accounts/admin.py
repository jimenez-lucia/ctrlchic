from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "firebase_uid", "created_at")
    search_fields = ("user__email", "firebase_uid")
    readonly_fields = ("created_at", "updated_at")
    list_filter = ("created_at",)
