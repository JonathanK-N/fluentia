from django.urls import path
from .views import (
    BankListView,
    BankDetailView,
    TransitionView,
    ForkView,
    HistoryView,
    PublishView,
    MediaUploadView,
    BankImportView,
    BankExportView,
    AudioView,
)
from .progress import ProgressView

urlpatterns = [
    path("progress/", ProgressView.as_view()),
    path("bank/", BankListView.as_view()),
    path("bank/import/", BankImportView.as_view()),
    path("bank/export/", BankExportView.as_view()),
    path("bank/publish/", PublishView.as_view()),
    path("bank/media/", MediaUploadView.as_view()),
    path("bank/<uuid:item_id>/", BankDetailView.as_view()),
    path("bank/<uuid:item_id>/transition/", TransitionView.as_view()),
    path("bank/<uuid:item_id>/versions/", ForkView.as_view()),
    path("bank/<uuid:item_id>/history/", HistoryView.as_view()),
    path(
        "attempts/<uuid:attempt_id>/questions/<uuid:question_id>/audio/",
        AudioView.as_view(),
    ),
]
