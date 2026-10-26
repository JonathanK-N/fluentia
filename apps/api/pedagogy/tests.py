"""Recette du lot 03 sur bases jetables, sans validation pédagogique réelle."""

import io
import tempfile
import wave
import math
import struct
from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient
from accounts.models import StudentProfile
from exams.models import Exam, Question, Answer, Attempt
from exams.services import create_attempt, save_answer, submit_attempt
from .models import BankItem, EditorialEvent, MediaAsset, ListeningAccess
from .services import (
    create_item,
    edit_item,
    transition,
    fork_item,
    publish_exam,
    upload_media,
    claim_audio,
    read_media,
    media_path,
)


def wav_upload(seconds=0.5):
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(8000)
        samples = [
            round(1000 * math.sin(2 * math.pi * 440 * index / 8000))
            for index in range(round(seconds * 8000))
        ]
        output.writeframes(struct.pack("<" + "h" * len(samples), *samples))
    return SimpleUploadedFile(
        "fixture.wav", buffer.getvalue(), content_type="audio/wav"
    )


def content(skill="reading", media=None):
    return {
        "skill": skill,
        "statement": "Quand commence l'atelier ?",
        "passage": "L'atelier commence samedi à dix heures."
        if skill == "reading"
        else "",
        "media": media,
        "choices": [
            "Samedi à dix heures",
            "Vendredi à neuf heures",
            "Dimanche à midi",
            "Lundi soir",
        ],
        "correct_index": 0,
        "explanation": "Le jour et l'heure sont explicitement annoncés.",
        "provenance": "Texte original synthétique de recette ; aucun avis humain réel.",
        "credit": "Fixture technique.",
    }


def approve(editor, reviewer, data=None):
    item = create_item(editor, data or content())
    item = transition(editor, item.pk, item.revision, "request_review")
    return transition(
        reviewer,
        item.pk,
        item.revision,
        "approve",
        note="Attestation SYNTHÉTIQUE réservée au test automatisé.",
        attest=True,
    )


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class PedagogyTests(TestCase):
    def test_e2e_accounts_refused_on_non_disposable_databases(self):
        import os
        import runpy
        from pathlib import Path
        from types import SimpleNamespace

        guard = runpy.run_path(
            str(Path(__file__).resolve().parents[3] / "scripts/e2e_guard.py")
        )["require_disposable"]
        with patch.dict(os.environ, {"FLUENTIA_E2E": "1"}):
            for database in [
                {
                    "ENGINE": "django.db.backends.postgresql",
                    "NAME": "fluentia_prod",
                    "HOST": "127.0.0.1",
                },
                {
                    "ENGINE": "django.db.backends.postgresql",
                    "NAME": "fluentia_e2e",
                    "HOST": "db.example.test",
                },
                {"ENGINE": "django.db.backends.sqlite3", "NAME": "db.sqlite3"},
            ]:
                with self.assertRaises(SystemExit):
                    guard(SimpleNamespace(DEBUG=True, DATABASES={"default": database}))
            guard(
                SimpleNamespace(
                    DEBUG=True,
                    DATABASES={
                        "default": {
                            "ENGINE": "django.db.backends.postgresql",
                            "NAME": "fluentia_e2e",
                            "HOST": "127.0.0.1",
                        }
                    },
                )
            )

    def setUp(self):
        cache.clear()
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        settings = override_settings(PRIVATE_MEDIA_ROOT=self.media_directory.name)
        settings.enable()
        self.addCleanup(settings.disable)
        User = get_user_model()
        self.editor = User.objects.create_user(
            username="editor-fixture", is_staff=True, is_superuser=True
        )
        self.reviewer = User.objects.create_user(
            username="reviewer-fixture", is_staff=True, is_superuser=True
        )
        self.student = User.objects.create_user(
            username="student-fixture", email="student@example.test"
        )
        self.other = User.objects.create_user(
            username="other-fixture", email="other@example.test"
        )
        StudentProfile.objects.create(
            user=self.student,
            email_verified_at=timezone.now(),
            verified_email=self.student.email,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.editor)

    def media(self, seconds=0.5):
        return upload_media(
            self.editor,
            wav_upload(seconds),
            title="Signal de recette uniquement",
            transcript="Fixture synthétique ; ne représente pas une parole pédagogique validée.",
            provenance="Signal technique créé pour les tests.",
        )

    def exam(self, skill="reading", mode="training", count=1):
        media = self.media() if skill == "listening" else None
        items = []
        for index in range(count):
            data = content(skill, media)
            if mode == "simulation":
                data["difficulty"] = ["A1", "A2", "B1", "B2", "C1", "C2"][
                    min(index // 7, 5)
                ]
            items.append(approve(self.editor, self.reviewer, data))
        exam = publish_exam(
            self.editor,
            slug="fixture-exam-" + skill,
            title="Recette technique",
            skill=skill,
            mode=mode,
            duration_seconds=(2100 if skill == "listening" else 3600)
            if mode == "simulation"
            else 120,
            item_ids=[i.pk for i in items],
        )
        return exam

    def test_editorial_end_to_end_and_audit(self):
        item = create_item(self.editor, content())
        original = item.revision
        item = edit_item(
            self.editor, item.pk, original, {**content(), "difficulty": "A2"}
        )
        record = item.events.last()
        self.assertEqual(record.before["revision"], original)
        self.assertEqual(record.after["revision"], original + 1)
        item = transition(self.editor, item.pk, item.revision, "request_review")
        item = transition(
            self.reviewer,
            item.pk,
            item.revision,
            "approve",
            note="Relecture de fixture, sans validation humaine réelle.",
            attest=True,
        )
        self.assertEqual(item.state, "approved")
        self.assertEqual(item.events.count(), 4)

    def test_self_approval_and_missing_attestation_forbidden(self):
        item = create_item(self.editor, content())
        item = transition(self.editor, item.pk, item.revision, "request_review")
        for actor, attest in [(self.editor, True), (self.reviewer, False)]:
            with self.assertRaises(ValidationError):
                transition(
                    actor, item.pk, item.revision, "approve", note="Test", attest=attest
                )
        item.refresh_from_db()
        self.assertEqual(item.state, "review")

    def test_stale_edit_and_edit_during_review_rejected(self):
        item = create_item(self.editor, content())
        edit_item(self.editor, item.pk, item.revision, content())
        with self.assertRaises(ValidationError):
            edit_item(self.editor, item.pk, item.revision, content())
        item.refresh_from_db()
        item = transition(self.editor, item.pk, item.revision, "request_review")
        with self.assertRaises(ValidationError):
            edit_item(self.editor, item.pk, item.revision, content())

    def test_reject_to_draft_and_resubmit(self):
        item = create_item(self.editor, content())
        item = transition(self.editor, item.pk, item.revision, "request_review")
        item = transition(
            self.reviewer, item.pk, item.revision, "reject", note="À corriger"
        )
        self.assertEqual(item.state, "draft")
        item = edit_item(self.editor, item.pk, item.revision, content())
        self.assertEqual(
            transition(self.editor, item.pk, item.revision, "request_review").state,
            "review",
        )

    def test_approved_frozen_even_sql_and_new_version_unapproved(self):
        item = approve(self.editor, self.reviewer)
        with self.assertRaises(IntegrityError), transaction.atomic():
            BankItem.objects.filter(pk=item.pk).update(statement="Altération")
        with self.assertRaises(IntegrityError), transaction.atomic():
            EditorialEvent.objects.filter(item=item).update(action="Altération")
        with self.assertRaises(IntegrityError), transaction.atomic():
            EditorialEvent.objects.filter(item=item).delete()
        copy = fork_item(self.editor, item.pk)
        self.assertEqual(copy.family, item.family)
        self.assertEqual(copy.version, 2)
        self.assertEqual(copy.state, "draft")
        self.assertIsNone(copy.reviewer_id)

    def test_four_distinct_choices_and_media_required_before_review(self):
        for choices in [["a", "b", "c"], ["a", "a", "b", "c"]]:
            with self.assertRaises(ValidationError):
                create_item(self.editor, {**content(), "choices": choices})
        item = create_item(self.editor, content("listening"))
        with self.assertRaises(ValidationError):
            transition(self.editor, item.pk, item.revision, "request_review")

    def test_students_and_unprivileged_staff_cannot_access_bank(self):
        for user in [
            self.student,
            get_user_model().objects.create_user(
                username="staff-no-perms", is_staff=True
            ),
        ]:
            self.client.force_authenticate(user)
            for route in ["bank/", "bank/export/", "bank/media/"]:
                self.assertEqual(self.client.get("/api/v1/" + route).status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/v1/bank/").status_code, 403)

    def test_json_export_import_roundtrip_does_not_approve(self):
        item = approve(self.editor, self.reviewer)
        response = self.client.get("/api/v1/bank/export/")
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            "/api/v1/bank/import/", response.data, format="json"
        )
        self.assertEqual(response.status_code, 201, response.data)
        imported = BankItem.objects.get(pk=response.data[0]["id"])
        self.assertEqual(imported.state, "draft")
        self.assertIsNone(imported.reviewer_id)
        self.assertNotEqual(imported.family, item.family)
        self.assertIn(str(item.family), imported.provenance)

    def test_import_rejects_forged_approval_and_is_atomic(self):
        payload = {
            **content(),
            "media": None,
            "state": "approved",
            "reviewer": self.reviewer.pk,
        }
        response = self.client.post(
            "/api/v1/bank/import/",
            {"format": "fluentia.bank.v1", "items": [payload]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(BankItem.objects.count(), 0)
        payload = content()
        response = self.client.post(
            "/api/v1/bank/import/",
            {
                "format": "fluentia.bank.v1",
                "items": [payload, {**payload, "choices": ["a"]}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(BankItem.objects.count(), 0)

    def test_publish_only_reviewed_items_and_reversible_failure(self):
        item = create_item(self.editor, content())
        with self.assertRaises(ValidationError):
            publish_exam(
                self.editor,
                slug="unreviewed",
                title="Test",
                skill="reading",
                mode="training",
                duration_seconds=60,
                item_ids=[item.pk],
            )
        self.assertFalse(Exam.objects.exists())
        self.assertFalse(Question.objects.exists())

    def test_published_versions_and_results_are_stable(self):
        exam = self.exam()
        item = BankItem.objects.get()
        self.assertEqual(item.state, "published")
        attempt = create_attempt(user=self.student, exam=exam)
        question = exam.questions.get()
        save_answer(
            user=self.student,
            attempt_id=attempt.pk,
            question_id=question.pk,
            choice_id=question.choices.get(is_correct=True).pk,
        )
        first = submit_attempt(user=self.student, attempt_id=attempt.pk)
        exam2 = publish_exam(
            self.editor,
            slug=exam.slug,
            title="Nouvelle édition",
            skill="reading",
            mode="training",
            duration_seconds=60,
            item_ids=[item.pk],
        )
        self.assertEqual(exam2.version, 2)
        self.assertEqual(
            submit_attempt(user=self.student, attempt_id=attempt.pk).correct_count,
            first.correct_count,
        )
        self.assertEqual(first.exam_id, exam.pk)

    def test_complete_reading_simulation_39_questions(self):
        exam = self.exam(mode="simulation", count=39)
        self.assertEqual(exam.questions.count(), 39)
        self.assertEqual(exam.duration_seconds, 3600)
        attempt = create_attempt(user=self.student, exam=exam)
        for question in exam.questions.all():
            save_answer(
                user=self.student,
                attempt_id=attempt.pk,
                question_id=question.pk,
                choice_id=question.choices.get(is_correct=True).pk,
            )
        result = submit_attempt(user=self.student, attempt_id=attempt.pk)
        self.assertEqual((result.correct_count, result.question_count), (39, 39))

    def test_bad_simulation_format_rolls_back_publication(self):
        item = approve(self.editor, self.reviewer, {**content(), "difficulty": "A1"})
        with self.assertRaises(ValidationError):
            publish_exam(
                self.editor,
                slug="bad-simulation",
                title="Test",
                skill="reading",
                mode="simulation",
                duration_seconds=3600,
                item_ids=[item.pk],
            )
        item.refresh_from_db()
        self.assertEqual(item.state, "approved")
        self.assertFalse(Exam.objects.exists())

    def test_listening_duration_budget_rejected_before_publication(self):
        media = self.media(60)
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
        with self.assertRaises(ValidationError):
            publish_exam(
                self.editor,
                slug="too-long-audio",
                title="Recette",
                skill="listening",
                mode="simulation",
                duration_seconds=2100,
                item_ids=[i.pk for i in items],
            )
        self.assertFalse(Exam.objects.exists())
        self.assertFalse(BankItem.objects.filter(state="published").exists())

    def test_media_pcm_validation_hash_and_immutability(self):
        media = self.media()
        self.assertEqual(len(read_media(media)), media.size)
        response = self.client.post(
            "/api/v1/bank/media/",
            {
                "file": wav_upload(),
                "title": "Import multipart de recette",
                "transcript": "Signal synthétique, pas une voix",
                "provenance": "Créé pour la recette HTTP",
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            MediaAsset.objects.get(pk=response.data["id"]).duration_ms, 500
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            MediaAsset.objects.filter(pk=media.pk).update(transcript="Altération")
        media_path(media).write_bytes(b"tampered")
        with self.assertRaises(ValidationError):
            read_media(media)
        for uploaded in [
            SimpleUploadedFile("x.wav", b"not a wave"),
            SimpleUploadedFile("x.wav", wav_upload().read()[:-10]),
        ]:
            with self.assertRaises(ValidationError):
                upload_media(
                    self.editor,
                    uploaded,
                    title="Test",
                    transcript="Test",
                    provenance="Test",
                )

    def test_media_delivery_owner_csrf_deadline_and_training_replay(self):
        exam = self.exam("listening")
        attempt = create_attempt(user=self.student, exam=exam)
        question = exam.questions.get()
        url = f"/api/v1/attempts/{attempt.pk}/questions/{question.pk}/audio/"
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post(url).status_code, 404)
        self.client.force_authenticate(self.student)
        for _ in range(2):
            response = self.client.post(url)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "audio/wav")
            self.assertIn("no-store", response["Cache-Control"])
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.force_authenticate(self.student)
        self.assertEqual(csrf_client.post(url).status_code, 403)
        with patch("exams.services.timezone.now", return_value=attempt.expires_at):
            self.assertEqual(self.client.post(url).status_code, 400)
        attempt.refresh_from_db()
        self.assertEqual(attempt.status, "expired")

    def test_audio_validation_crossing_deadline_does_not_deliver(self):
        exam = self.exam("listening")
        attempt = create_attempt(user=self.student, exam=exam)
        question = exam.questions.get()
        with patch(
            "exams.services.timezone.now",
            side_effect=[attempt.started_at, attempt.expires_at],
        ):
            with self.assertRaises(ValidationError):
                claim_audio(self.student, attempt.pk, question.pk)
        attempt.refresh_from_db()
        self.assertEqual(attempt.status, "expired")
        self.assertFalse(ListeningAccess.objects.filter(attempt=attempt).exists())

    def test_complete_listening_simulation_and_single_delivery(self):
        exam = self.exam("listening", mode="simulation", count=39)
        attempt = create_attempt(user=self.student, exam=exam)
        start = attempt.started_at
        self.client.force_authenticate(self.student)
        first_view = self.client.get(f"/api/v1/attempts/{attempt.pk}/").data
        self.assertNotIn("transcript", str(first_view))
        self.assertEqual(first_view["questions"][0]["choices"], [])
        questions = list(exam.questions.all())
        with self.assertRaises(ValidationError):
            claim_audio(self.student, attempt.pk, questions[1].pk)
        for index, question in enumerate(questions):
            now = start + timedelta(seconds=index * 2)
            with patch("django.utils.timezone.now", return_value=now):
                claim_audio(self.student, attempt.pk, question.pk)
                with self.assertRaises(ValidationError):
                    claim_audio(self.student, attempt.pk, question.pk)
                with self.assertRaises(ValidationError):
                    save_answer(
                        user=self.student,
                        attempt_id=attempt.pk,
                        question_id=question.pk,
                        choice_id=question.choices.get(is_correct=True).pk,
                    )
            with patch(
                "django.utils.timezone.now", return_value=now + timedelta(seconds=1)
            ):
                save_answer(
                    user=self.student,
                    attempt_id=attempt.pk,
                    question_id=question.pk,
                    choice_id=question.choices.get(is_correct=True).pk,
                )
                if index:
                    previous = questions[index - 1]
                    with self.assertRaises(ValidationError):
                        save_answer(
                            user=self.student,
                            attempt_id=attempt.pk,
                            question_id=previous.pk,
                            choice_id=previous.choices.get(is_correct=True).pk,
                        )
        self.assertEqual(ListeningAccess.objects.filter(attempt=attempt).count(), 39)
        with patch(
            "django.utils.timezone.now", return_value=start + timedelta(seconds=80)
        ):
            result = submit_attempt(user=self.student, attempt_id=attempt.pk)
            detail = self.client.get(f"/api/v1/attempts/{attempt.pk}/results/").data
        self.assertEqual((result.correct_count, result.question_count), (39, 39))
        self.assertIn("transcript", detail["details"][0])

    def test_progress_is_private_only_submitted_and_without_official_score(self):
        exam = self.exam()
        attempt = create_attempt(user=self.student, exam=exam)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/v1/progress/").data["groups"], [])
        submit_attempt(user=self.student, attempt_id=attempt.pk)
        response = self.client.get("/api/v1/progress/")
        self.assertFalse(response.data["official"])
        self.assertEqual(response.data["groups"][0]["attempts"], 1)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/v1/progress/").data["groups"], [])

    def test_original_seed_idempotent_and_never_published(self):
        call_command("seed_original_bank", stdout=io.StringIO())
        call_command("seed_original_bank", stdout=io.StringIO())
        self.assertEqual(BankItem.objects.count(), 3)
        self.assertFalse(BankItem.objects.exclude(state="draft").exists())
        self.assertFalse(BankItem.objects.exclude(reviewer=None).exists())
        self.assertFalse(Exam.objects.exists())
