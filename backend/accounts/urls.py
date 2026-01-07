from django.urls import path

from . import mannequin_views, views, wardrobe_views

urlpatterns = [
    path("me/", views.get_current_user, name="current_user"),
    path("test/", views.auth_test, name="auth_test"),
    # Mannequin image endpoints
    path("mannequin/upload-url/", mannequin_views.get_upload_url, name="mannequin_upload_url"),
    path("mannequin/confirm/", mannequin_views.confirm_upload, name="mannequin_confirm"),
    path("mannequin/", mannequin_views.get_mannequin, name="mannequin_get"),
    path("mannequin/delete/", mannequin_views.delete_mannequin, name="mannequin_delete"),
    # Wardrobe endpoints
    path("wardrobe/upload-url/", wardrobe_views.get_upload_url, name="wardrobe_upload_url"),
    path("wardrobe/confirm/", wardrobe_views.confirm_upload, name="wardrobe_confirm"),
    path("wardrobe/", wardrobe_views.list_items, name="wardrobe_list"),
    path("wardrobe/<str:item_id>/", wardrobe_views.delete_item, name="wardrobe_delete"),
]
