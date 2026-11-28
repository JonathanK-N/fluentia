"""Estimation non officielle du niveau d’une épreuve de Lecture ou d’Écoute, sur le barème du TCF Canada.

Le score est ramené sur 699 (une simulation de 39 questions vaut déjà 699 points), puis :
- niveau CECR : six paliers de 100 points (A1 < 200, A2 200-299 … C2 600-699) ;
- NCLC : tableaux d’équivalence d’IRCC pour le TCF Canada, différents pour la compréhension écrite et orale.
"""

LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
TCF_MAX = 699

# (score TCF minimum, NCLC), du plus haut au plus bas.
NCLC_TABLES = {
    "reading": [(549, "10+"), (524, "9"), (499, "8"), (453, "7"), (406, "6"), (375, "5"), (342, "4")],
    "listening": [(549, "10+"), (523, "9"), (503, "8"), (458, "7"), (398, "6"), (369, "5"), (331, "4")],
}
BELOW = "3 ou moins"


def qcm_estimate(skill, score, max_score):
    """{tcf_score, step, level, nclc} d’une tentative ; None sans barème."""
    if not max_score:
        return None
    tcf = round(TCF_MAX * max(0, score or 0) / max_score)
    step = min(5, max(0, tcf // 100 - 1))
    table = NCLC_TABLES.get(skill, NCLC_TABLES["reading"])
    nclc = next((value for minimum, value in table if tcf >= minimum), BELOW)
    return {"tcf_score": tcf, "step": step, "level": LEVELS[step], "nclc": nclc}
