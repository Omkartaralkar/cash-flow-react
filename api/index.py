import sys
import os

# Resolve absolute path to the backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, '..', 'backend'))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ignore static linter check since sys.path is updated dynamically at runtime
from app import app  # type: ignore # noqa: E402