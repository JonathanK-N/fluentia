"""Routage versionné des examens Fluentia."""

from django.urls import path
from .views import (
    ExamListView,
    ExamDetailView,
    StartAttemptView,
    AttemptView,
    SaveAnswerView,
    SubmitAttemptView,
    AttemptResultsView,
)

urlpatterns = [
    path("exams/", ExamListView.as_view(), name="exams-list"),
    path("exams/<uuid:exam_id>/", ExamDetailView.as_view(), name="exams-detail"),
    path(
        "exams/<uuid:exam_id>/attempts/", StartAttemptView.as_view(), name="exams-start"
    ),
    path("attempts/<uuid:attempt_id>/", AttemptView.as_view(), name="attempt-detail"),
    path(
        "attempts/<uuid:attempt_id>/answers/",
        SaveAnswerView.as_view(),
        name="attempt-save-answer",
    ),
    path(
        "attempts/<uuid:attempt_id>/submit/",
        SubmitAttemptView.as_view(),
        name="attempt-submit",
    ),
    path(
        "attempts/<uuid:attempt_id>/results/",
        AttemptResultsView.as_view(),
        name="attempt-results",
    ),
]
