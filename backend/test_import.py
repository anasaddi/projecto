import sys
import traceback

sys.path.insert(0, '.')

print("Trying to import config...")
try:
    from app.api.routes import config
    print("SUCCESS: config")
except Exception as e:
    print("FAILED: config")
    traceback.print_exc()

print("Trying to import auth...")
try:
    from app.api.routes import auth
    print("SUCCESS: auth")
except Exception as e:
    print("FAILED: auth")
    traceback.print_exc()
