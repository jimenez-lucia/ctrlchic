from django.urls import path

from . import mannequin_views, views

urlpatterns = [
    path("me/", views.get_current_user, name="current_user"),
    path("test/", views.auth_test, name="auth_test"),
    # Mannequin image endpoints
    path("mannequin/upload-url/", mannequin_views.get_upload_url, name="mannequin_upload_url"),
    path("mannequin/confirm/", mannequin_views.confirm_upload, name="mannequin_confirm"),
    path("mannequin/", mannequin_views.get_mannequin, name="mannequin_get"),
    path("mannequin/delete/", mannequin_views.delete_mannequin, name="mannequin_delete"),
]
