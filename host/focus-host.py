#!/Library/Frameworks/Python.framework/Versions/3.10/bin/python3
import sys
import struct
import json
import time

# === Helper functions ===
def read_message():
    # Read 4-byte length prefix
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length or len(raw_length) < 4:
        return None
    message_length = struct.unpack('<I', raw_length)[0]

    # Read the actual JSON message
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    if not message:
        return None
    try:
        return json.loads(message)
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON received: {message}", file=sys.stderr)
        return None

def send_message(message):
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.flush()

# === Main loop ===
def main():
    print("Focus Host started", file=sys.stderr)
    while True:
        msg = read_message()
        if msg is None:
            # EOF or invalid message
            continue

        if 'command' in msg:
            command = msg['command']
            print(f"📩 Received command: {command}", file=sys.stderr)
            # Simulate doing something
            time.sleep(0.5)
            send_message({"status": f"✅ Test received {command}"})
        else:
            send_message({"error": "❌ No 'command' key in message"})

if __name__ == "__main__":
    main()
