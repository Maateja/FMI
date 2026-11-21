import sys
from pathlib import Path

# Automatically ensure apps/agent is at the front of sys.path for all agent tests
agent_root = str(Path(__file__).resolve().parent)
if sys.path[0] != agent_root:
    sys.path.insert(0, agent_root)
