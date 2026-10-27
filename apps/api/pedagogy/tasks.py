"""Format des trois tâches de Rédaction et d’Oral ; les sujets viennent du jeu actif en base."""

from .models import TaskSet

# Repères de format TCF, communs à tous les jeux de sujets.
FORMATS = {
    "writing": {
        1: {"title": "Message du quotidien", "advice": ["Saluez et prenez congé selon le destinataire.", "Répondez à chaque point demandé par la consigne.", "Préférez des phrases courtes et des connecteurs simples."]},
        2: {"title": "Récit ou article", "advice": ["Structurez votre texte : introduction, développement, conclusion.", "Racontez avec des temps du passé variés et cohérents.", "Ajoutez votre ressenti et un exemple précis."]},
        3: {"title": "Comparer deux points de vue", "advice": ["Présentez brièvement le thème et les deux positions.", "Reformulez les arguments, sans recopier les documents.", "Donnez une opinion personnelle justifiée et nuancée."]},
    },
    "speaking": {
        1: {"title": "Entretien dirigé", "goal": "Parler de vous, de votre parcours et de vos habitudes.", "advice": ["Développez chaque réponse en deux ou trois phrases.", "Donnez des exemples concrets plutôt que des listes.", "Gardez un rythme posé et articulez."]},
        2: {"title": "Exercice en interaction", "goal": "Obtenir des informations en posant des questions variées.", "advice": ["Préparez des questions ouvertes et fermées.", "Variez les formes : inversion, « est-ce que », intonation.", "Rebondissez sur les réponses pour approfondir."]},
        3: {"title": "Expression d’un point de vue", "goal": "Défendre une opinion de façon structurée et convaincante.", "advice": ["Annoncez clairement votre position.", "Appuyez-vous sur deux ou trois arguments illustrés.", "Concluez en reformulant votre avis."]},
    },
}


def tasks_payload(task_set):
    """Les trois tâches du jeu, avec leurs sujets, au format attendu par les studios."""
    skill = task_set.skill
    tasks = []
    for number in (1, 2, 3):
        subjects = [s for s in task_set.subjects.all() if s.task_number == number]
        if not subjects:
            continue
        first, form = subjects[0], FORMATS[skill][number]
        task = {"slug": f"tache-{number}", "number": number, "title": form["title"], "advice": form["advice"]}
        if skill == "writing":
            task.update(
                genre=first.genre, min=first.min_words, max=first.max_words, minutes=first.minutes,
                subjects=[{"title": s.title, "prompt": s.prompt, "documents": s.documents} for s in subjects],
            )
        else:
            task.update(
                goal=form["goal"], seconds=first.speak_seconds, prepSeconds=first.prep_seconds,
                subjects=[{"title": s.title, "prompt": s.prompt, "cues": s.cues} for s in subjects],
            )
        tasks.append(task)
    return {"title": task_set.title, "tasks": tasks}


def active_tasks(skill):
    task_set = TaskSet.objects.filter(skill=skill, is_active=True).prefetch_related("subjects").first()
    return tasks_payload(task_set) if task_set else {"title": "", "tasks": []}
