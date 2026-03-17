import sys
import traceback

sys.path.append('.')

print("Starting debug import...")

modules = ["sources", "content", "insights", "search", "youtube", "training", "config", "auth"]
for m in modules:
    try:
        print(f"Importing app.api.routes.{m}...")
        exec(f"from app.api.routes import {m}")
    except Exception as e:
        print(f"FAILED to import app.api.routes.{m}: {e}")
        traceback.print_exc()

try:
    print("Importing app.main...")
    import app.main
    print("Done importing app.main")
except Exception as e:
    print(f"FAILED to import app.main: {e}")
    traceback.print_exc()

print("FINISHED")
