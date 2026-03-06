import json
import os

paths = {
    "about": "C:/Users/admin/.gemini/antigravity/brain/cb3c5836-a787-4e5b-8400-454c54781b5d/.system_generated/steps/22/output.txt",
    "work": "C:/Users/admin/.gemini/antigravity/brain/cb3c5836-a787-4e5b-8400-454c54781b5d/.system_generated/steps/23/output.txt",
    "contact": "C:/Users/admin/.gemini/antigravity/brain/cb3c5836-a787-4e5b-8400-454c54781b5d/.system_generated/steps/24/output.txt"
}

out_dir = r"c:\Users\admin\Desktop\my website\portofollio"

for name, path in paths.items():
    with open(path, 'r', encoding='utf-8') as f:
        line = f.readline()
        data = json.loads(line)
        html = data[0]['html']
        
        with open(os.path.join(out_dir, f"{name}.html"), 'w', encoding='utf-8') as out_f:
            out_f.write(html)
