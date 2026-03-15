from fastapi import APIRouter, Depends
from app.config import get_settings
from app.api.deps import get_current_admin

router = APIRouter(dependencies=[Depends(get_current_admin)])

@router.get("/constants")
async def get_constants():
    """Return shared constants between frontend and backend."""
    # This matches the structure in frontend/src/components/training/calendarConstants.js
    return {
        "MUSCLE_GROUP_MAP": {
            "chest": "petto", "upper_chest": "petto",
            "lats": "schiena", "rhomboids": "schiena", "traps": "schiena", "lower_back": "schiena",
            "anterior_delts": "spalle", "lateral_delts": "spalle", "rear_delts": "spalle",
            "biceps": "bicipiti", "brachialis": "bicipiti", "brachioradialis": "avambracci", "brachiale_brachioradiale": "bicipiti",
            "triceps": "tricipiti",
            "forearms": "avambracci", "pronators": "avambracci", "supinators": "avambracci",
            "wrist_extensors": "avambracci", "wrist_flexors": "avambracci", "finger_flexors": "avambracci",
            "ulnar_deviation": "avambracci", "radial_deviation": "avambracci", "side_pressure": "avambracci",
            "quads": "gambe", "glutes": "gambe", "core": "core"
        },
        "MUSCLE_DISPLAY_NAME": {
            "chest": "Petto", "upper_chest": "Petto Alt", "lats": "Dorsali", "rhomboids": "Romb", "traps": "Trapezi", 
            "lower_back": "L. Back", "anterior_delts": "Delt. Ant", "lateral_delts": "Delt. Lat", "rear_delts": "Delt. Post",
            "biceps": "Bicipiti", "brachialis": "Brachio", "brachioradialis": "Brachio", "brachiale_brachioradiale": "Brachio",
            "triceps": "Tricipiti", "forearms": "Avambr.", "pronators": "Pronat", "supinators": "Supinat",
            "wrist_extensors": "Est. Polso", "wrist_flexors": "Fles. Polso", "finger_flexors": "Fles. Dita",
            "ulnar_deviation": "Dev. Uln", "radial_deviation": "Dev. Rad", "side_pressure": "Side P.",
            "quads": "Quad", "glutes": "Glutei", "core": "Core"
        },
        "WEEK_CONFIGS": [
            { "label": "5x5", "anas": "5x5", "flavio": "5x5" },
            { "label": "6x4", "anas": "6x4", "flavio": "6x4" },
            { "label": "5x3", "anas": "5x3", "flavio": "5x3" },
            { "label": "3x2", "anas": "3x2", "flavio": "3x2" },
            { "label": "MAX", "anas": "MAX", "flavio": "MAX" },
            { "label": "DL",  "anas": "DL",  "flavio": "DL"  }
        ],
        "EXERCISE_MUSCLE_MAP": {
            "curl_str": ["biceps", "brachiale_brachioradiale"],
            "mp_str": ["anterior_delts", "lateral_delts", "triceps"],
            "bp_str": ["chest", "anterior_delts", "triceps"],
            "sq_str": ["core", "glutes", "lower_back", "quads"],
            "plank": ["core", "lower_back"],
            "crunch": ["core"],
            "leg_raise": ["core"],
            "ab_wheel": ["core", "lower_back"],
            "cable_crunch": ["core"],
            "pu_str": ["biceps", "brachiale_brachioradiale", "finger_flexors", "lats", "rear_delts", "rhomboids", "traps"],
            "bulgarian": ["glutes", "quads"],
            "flyes": ["chest"],
            "conc_curl": ["biceps"],
            "curl_ez": ["biceps", "brachiale_brachioradiale"],
            "dips": ["chest", "anterior_delts", "triceps"],
            "overhead_ext": ["triceps"],
            "ez_bar_reverse_curl": ["brachiale_brachioradiale", "wrist_extensors"],
            "jm_press": ["side_pressure", "triceps"],
            "lat_machine": ["brachiale_brachioradiale", "lats", "rhomboids"],
            "single_lat_pull": ["lats", "rhomboids", "traps"],
            "mil_db": ["anterior_delts", "chest", "lateral_delts", "triceps"],
            "bp_el": ["chest", "anterior_delts", "triceps"],
            "bp_pause": ["chest", "anterior_delts", "triceps"],
            "inc_db_press": ["chest", "anterior_delts", "triceps"],
            "pulley": ["brachiale_brachioradiale", "lats", "rhomboids", "traps"],
            "single_pushdown": ["triceps"],
            "high_row": ["rear_delts", "rhomboids", "traps"],
            "front_raise": ["anterior_delts"],
            "lat_raise": ["lateral_delts"],
            "lat_raise_light": ["lateral_delts"],
            "rear_raise": ["rear_delts"],
            "sq_hypertrophy": ["glutes", "quads"],
            "aw_v1_flessione_polsi": ["forearm_flexors"],
            "aw_v1_dita": ["finger_flexors"],
            "aw_v1_ext_polsi": ["forearm_extensors"],
            "aw_v1_ulnar_chop": ["ulnar_deviation"],
            "aw_v1_wrist_wrench": ["finger_flexors", "wrist_flexors"],
            "aw_v2_cupping": ["wrist_flexors"],
            "aw_v2_pronazione": ["pronators"],
            "aw_v2_rev_pron": ["pronators"],
            "aw_v2_rising": ["radial_deviation"],
            "aw_v2_supination": ["supinators"],
            "vol1": ["brachiale_brachioradiale", "finger_flexors", "side_pressure", "ulnar_deviation", "wrist_flexors"],
            "vol2": ["wrist_flexors", "pronators", "radial_deviation", "supinators"]
        }
    }
