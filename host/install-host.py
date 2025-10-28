#!/usr/bin/env python3
import os
import sys
import json
import shutil
import platform
from pathlib import Path
import stat

# -----------------------------
# Check arguments
# -----------------------------
if len(sys.argv) < 2:
    print("Usage: python3 install-host.py <chrome-extension-id>")
    sys.exit(1)

EXTENSION_ID = sys.argv[1]
HOST_NAME = "com.focus.host"
DESCRIPTION = "Focus LED Native Host"

# -----------------------------
# Paths
# -----------------------------
HERE = Path(__file__).parent.resolve()
HOST_SCRIPT = HERE / "focus-host.py"

system = platform.system()
if system == "Darwin":
    CHROME_HOST_DIR = Path.home() / "Library/Application Support/Google/Chrome/NativeMessagingHosts"
elif system == "Windows":
    CHROME_HOST_DIR = Path(os.environ["LOCALAPPDATA"]) / "Google/Chrome/User Data/NativeMessagingHosts"
else:  # Linux
    CHROME_HOST_DIR = Path.home() / ".config/google-chrome/NativeMessagingHosts"

MANIFEST_PATH = CHROME_HOST_DIR / f"{HOST_NAME}.json"

# -----------------------------
# Detect Python 3 path
# -----------------------------
python_path = shutil.which("python3")
if not python_path:
    print("❌ Python 3 not found. Please install Python 3.")
    sys.exit(1)

# -----------------------------
# Ensure focus-host.py exists
# -----------------------------
if not HOST_SCRIPT.exists():
    print(f"❌ Error: {HOST_SCRIPT} not found.")
    sys.exit(1)

# -----------------------------
# Rewrite first line of focus-host.py with detected Python path (only macOS/Linux)
# -----------------------------
if system != "Windows":
    lines = HOST_SCRIPT.read_text().splitlines()
    lines[0] = f"#!{python_path}"
    HOST_SCRIPT.write_text("\n".join(lines) + "\n")
    print(f"✅ Updated shebang in {HOST_SCRIPT} to {python_path}")

# -----------------------------
# Make focus-host.py executable (only macOS/Linux)
# -----------------------------
if system != "Windows":
    st = HOST_SCRIPT.stat()
    HOST_SCRIPT.chmod(st.st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    print(f"✅ Made {HOST_SCRIPT} executable")

# -----------------------------
# Create Chrome native messaging manifest
# -----------------------------
CHROME_HOST_DIR.mkdir(parents=True, exist_ok=True)

manifest = {
    "name": HOST_NAME,
    "description": DESCRIPTION,
    "path": str(HOST_SCRIPT),  # absolute path to script
    "type": "stdio",
    "allowed_origins": [f"chrome-extension://{EXTENSION_ID}/"]
}

with open(MANIFEST_PATH, "w") as f:
    json.dump(manifest, f, indent=4)

print(f"✅ Installed native host manifest at: {MANIFEST_PATH}")
print(f"🔗 Allowed origin: chrome-extension://{EXTENSION_ID}/")

# -----------------------------
# Done
# -----------------------------
print("🎉 Setup complete! The Chrome extension can now communicate with the LED via focus-host.py")
