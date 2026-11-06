"""Propositions originales : aucune personne ni validation humaine inventée."""

from django.core.management.base import BaseCommand
from django.db import transaction
from pedagogy.models import BankItem, EditorialEvent

SAMPLES = [
    dict(
        family="2bdd0365-ae8e-4545-b4b2-e7adc53e5081",
        skill="reading",
        statement="Quand faut-il confirmer sa présence ?",
        passage="L'association organise une promenade dimanche matin. Pour adapter le nombre d'accompagnateurs, les participants doivent confirmer leur présence avant jeudi soir. Le rendez-vous est fixé à neuf heures devant la mairie.",
        choices=[
            "Avant jeudi soir",
            "Dimanche à midi",
            "Samedi matin",
            "Après la promenade",
        ],
        correct_index=0,
        explanation="La confirmation est demandée avant jeudi soir ; le dimanche est le jour de la promenade.",
    ),
    dict(
        family="d8ea268f-e292-4fee-a4b9-5c58bc101c43",
        skill="listening",
        statement="Pourquoi les voyageurs doivent-ils changer de quai ?",
        passage="",
        choices=[
            "Des travaux empêchent l'accès habituel",
            "Le train est annulé",
            "Les billets doivent être échangés",
            "Le départ est avancé",
        ],
        correct_index=0,
        explanation="L'annonce attribue le changement de quai aux travaux, sans annoncer d'annulation ni de changement d'heure.",
    ),
    dict(
        family="8585660f-b5f0-4260-88a1-975148a1080c",
        skill="reading",
        statement="Quel est le but principal de cette mesure ?",
        passage="La bibliothèque expérimente la réservation de salles par créneaux de deux heures. L'objectif n'est pas de réduire le temps d'ouverture, mais de permettre à davantage de groupes de travailler au calme. Un bilan sera réalisé après trois mois avant de décider si le dispositif est conservé.",
        choices=[
            "Répartir plus équitablement l'accès aux salles",
            "Réduire les horaires de la bibliothèque",
            "Supprimer les travaux de groupe",
            "Rendre les réservations payantes",
        ],
        correct_index=0,
        explanation="La rotation des créneaux vise à accueillir davantage de groupes ; il s'agit d'une expérimentation, pas d'une réduction des horaires.",
    ),
]


class Command(BaseCommand):
    help = "Créer trois brouillons originaux, sans approbation ni publication"

    @transaction.atomic
    def handle(self, *args, **options):
        count = 0
        for sample in SAMPLES:
            family = sample["family"]
            if BankItem.objects.filter(family=family).exists():
                continue
            item = BankItem(
                **sample,
                provenance="Proposition originale du lot 03. À vérifier : langue, pertinence, distracteurs et droits. Audio à enregistrer pour l'item oral.",
                credit="Proposition assistée, sans attribution fictive de rédaction ou de relecture humaine.",
            )
            item.save()
            EditorialEvent.objects.create(
                item=item,
                actor=None,
                action="seed_draft",
                after={
                    "state": "draft",
                    "notice": "À relire humainement ; aucun média approuvé.",
                },
            )
            count += 1
        self.stdout.write(f"{count} brouillons ajoutés. Aucun examen publié.")
