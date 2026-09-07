import subprocess
import time
import urllib.request
import json
import os

ngrok_path = r"C:\Users\gadam\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"

print(f"Starting ngrok tunnel from {ngrok_path} for port 5173...")
proc = subprocess.Popen([ngrok_path, "http", "5173"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

tunnel_url = None
for attempt in range(12):
    time.sleep(1)
    try:
        req = urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels")
        data = json.loads(req.read().decode("utf-8"))
        if data.get("tunnels"):
            tunnel_url = data["tunnels"][0]["public_url"]
            print(f"\n========================================================")
            print(f"🎉 SUCCESS! NGROK PUBLIC TUNNEL IS ACTIVE!")
            print(f"🔗 Public Link: {tunnel_url}")
            print(f"========================================================\n", flush=True)
            break
    except Exception as e:
        print(f"Waiting for ngrok tunnel initialization... ({attempt + 1}/12)", flush=True)

if not tunnel_url:
    print("Could not retrieve tunnel URL from ngrok API.", flush=True)

# Keep process alive
proc.wait()
