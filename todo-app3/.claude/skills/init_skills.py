#!/usr/bin/env python3
"""
Initialization script for ChatKit skills
"""

import os
from pathlib import Path

def init_chatkit_skills():
    """Initialize all ChatKit skills with basic structure"""

    skills = [
        "chatkit-agent-memory",
        "chatkit-backend",
        "chatkit-debug",
        "chatkit-store"
    ]

    for skill in skills:
        skill_path = Path(f"./{skill}")

        # Create main skill directory if it doesn't exist
        skill_path.mkdir(exist_ok=True)

        # Create subdirectories
        (skill_path / "scripts").mkdir(exist_ok=True)
        (skill_path / "references").mkdir(exist_ok=True)
        (skill_path / "assets").mkdir(exist_ok=True)

        print(f"Initialized skill: {skill}")
        print(f"  - {skill_path}")
        print(f"  - {skill_path / 'scripts'}")
        print(f"  - {skill_path / 'references'}")
        print(f"  - {skill_path / 'assets'}")
        print()

    print("All ChatKit skills initialized successfully!")
    print("\nSkills created:")
    for skill in skills:
        print(f"  - {skill}")

if __name__ == "__main__":
    print("Initializing ChatKit skills...")
    init_chatkit_skills()