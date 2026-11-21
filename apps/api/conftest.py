import sys
from pathlib import Path

# Automatically ensure apps/api is at the front of sys.path for all api tests
api_root = str(Path(__file__).resolve().parent)
if sys.path[0] != api_root:
    sys.path.insert(0, api_root)
