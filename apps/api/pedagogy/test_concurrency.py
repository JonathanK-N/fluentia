"""Courses réelles PostgreSQL, sans assimiler les verrous SQLite à des verrous de lignes."""

import tempfile
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless
from django.contrib.auth import get_user_model
from django.db import connection, connections, close_old_connections
from django.test import TransactionTestCase, override_settings
from rest_framework.exceptions import ValidationError
from exams.services import create_attempt
from .models import BankItem
from .services import create_item, edit_item, publish_exam, upload_media, claim_audio
from .tests import approve, content, wav_upload


@skipUnless(
    connection.vendor == "postgresql", "Courses éditoriales réservées à PostgreSQL."
)
@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class EditorialConcurrencyTests(TransactionTestCase):
    def setUp(self):
        User = get_user_model()
        self.editor = User.objects.create_user(
            username="concurrent-editor", is_staff=True, is_superuser=True
        )
        self.reviewer = User.objects.create_user(
            username="concurrent-reviewer", is_staff=True, is_superuser=True
        )
        self.student = User.objects.create_user(username="concurrent-student")
        self.media_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_dir.cleanup)
        settings = override_settings(PRIVATE_MEDIA_ROOT=self.media_dir.name)
        settings.enable()
        self.addCleanup(settings.disable)

    def parallel(self, function):
        barrier = Barrier(2)

        def call(index):
            close_old_connections()
            try:
                barrier.wait(timeout=15)
                try:
                    return function(index)
                except ValidationError:
                    return "rejected"
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as pool:
            return list(pool.map(call, [0, 1]))

    def test_compare_and_swap_edit_allows_one_writer(self):
        item = create_item(self.editor, content())
        result = self.parallel(
            lambda index: str(
                edit_item(
                    self.editor,
                    item.pk,
                    item.revision,
                    {**content(), "credit": str(index)},
                ).pk
            )
        )
        self.assertEqual(result.count("rejected"), 1)
        item.refresh_from_db()
        self.assertEqual(item.revision, 2)
        self.assertEqual(item.events.count(), 2)

    def test_concurrent_publications_get_distinct_versions(self):
        items = [
            approve(self.editor, self.reviewer),
            approve(self.editor, self.reviewer),
        ]

        def publish(index):
            return publish_exam(
                [self.editor, self.reviewer][index],
                slug="same-series",
                title="Course technique",
                skill="reading",
                mode="training",
                duration_seconds=60,
                item_ids=[items[index].pk],
            ).version

        self.assertEqual(sorted(self.parallel(publish)), [1, 2])

    def test_audio_is_delivered_to_parallel_requests(self):
        media = upload_media(
            self.editor,
            wav_upload(),
            title="Fixture",
            transcript="Signal de recette",
            provenance="Création technique de test",
        )
        items = [
            approve(
                self.editor,
                self.reviewer,
                {
                    **content("listening", media),
                    "difficulty": ["A1", "A2", "B1", "B2", "C1", "C2"][
                        min(index // 7, 5)
                    ],
                },
            )
            for index in range(39)
        ]
        exam = publish_exam(
            self.editor,
            slug="concurrent-audio",
            title="Simulation technique",
            skill="listening",
            mode="simulation",
            duration_seconds=2100,
            item_ids=[i.pk for i in items],
        )
        attempt = create_attempt(user=self.student, exam=exam)
        question = exam.questions.first()

        def deliver(_):
            claim_audio(self.student, attempt.pk, question.pk)
            return "delivered"

        self.assertEqual(sorted(self.parallel(deliver)), ["delivered", "delivered"])
