import urllib.request
import zipfile
import io

print("Downloading ngrok zip archive...")
url = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
req = urllib.request.urlopen(url)
data = req.read()
print(f"Downloaded {len(data)} bytes. Extracting...")
zf = zipfile.ZipFile(io.BytesIO(data))
zf.extractall(r"c:\Users\gadam\OneDrive\Documents\Multi Negotation agent project")
print("Extracted ngrok.exe successfully!")
