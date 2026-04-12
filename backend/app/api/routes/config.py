from fastapi import APIRouter
from app.config import get_settings

router = APIRouter()

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
        },
        "PRAYERS": ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
        "MUSCLE_BADGE_STYLE": {
            "petto": 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
            "schiena": 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
            "spalle": 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
            "bicipiti": 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
            "tricipiti": 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
            "avambracci": 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
            "gambe": 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
            "core": 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
            "unknown": 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
        },
        "GROUP_ACCENT_DOT": {
            "petto": 'bg-gradient-to-br from-red-400 to-red-600',
            "schiena": 'bg-gradient-to-br from-emerald-400 to-emerald-600',
            "spalle": 'bg-gradient-to-br from-violet-400 to-violet-600',
            "bicipiti": 'bg-gradient-to-br from-blue-400 to-blue-600',
            "tricipiti": 'bg-gradient-to-br from-cyan-400 to-cyan-600',
            "avambracci": 'bg-gradient-to-br from-amber-400 to-orange-500',
            "gambe": 'bg-gradient-to-br from-pink-400 to-rose-600',
            "core": 'bg-gradient-to-br from-teal-400 to-teal-600'
        },
        "MUSCLE_DOT_COLORS": {
            "chest": 'bg-red-500', "upper_chest": 'bg-red-400', 
            "lats": 'bg-emerald-500', "rhomboids": 'bg-emerald-400', "traps": 'bg-emerald-600', "lower_back": 'bg-emerald-700',
            "anterior_delts": 'bg-violet-500', "lateral_delts": 'bg-violet-400', "rear_delts": 'bg-violet-600',
            "biceps": 'bg-blue-500', "brachialis": 'bg-blue-400', "brachioradialis": 'bg-blue-600', "brachiale_brachioradiale": 'bg-blue-500',
            "triceps": 'bg-cyan-500', 
            "forearms": 'bg-amber-500', "pronators": 'bg-amber-400', "supinators": 'bg-amber-600',
            "wrist_extensors": 'bg-orange-500', "wrist_flexors": 'bg-orange-600', "finger_flexors": 'bg-orange-400',
            "ulnar_deviation": 'bg-pink-500', "radial_deviation": 'bg-pink-400', "side_pressure": 'bg-pink-600',
            "quads": 'bg-pink-500', "glutes": 'bg-rose-600', "core": 'bg-teal-500'
        }
    }
