import json
import re

path = r'C:\Users\Anas\.cursor\projects\c-Users-Anas-Desktop-projecto\agent-transcripts\d49cd26d-3218-4fd9-bd32-c06c812e842f\d49cd26d-3218-4fd9-bd32-c06c812e842f.jsonl'
lines = []
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'border-[1.5px]' in line or 'text-[9px]' in line:
            lines.append(line)

print(f'Found {len(lines)} lines')

for i, line in enumerate(lines):
    # Search for "contents": "..." using regex
    # Since the string can contain escaped quotes, we use a trick:
    # Match `"contents": ` then a double quote, then anything until `", "path":`
    
    match = re.search(r'"contents":\s*"(.*?)",\s*"path":', line, flags=re.DOTALL)
    if match:
        content_str = match.group(1)
        # Try to parse the json string to handle escaped quotes and newlines
        try:
            content = json.loads('"' + content_str + '"')
            if 'export default function ' in content:
                with open(f'compact_code_extract_{i}.txt', 'w', encoding='utf-8') as out:
                    out.write(content)
                print(f'Wrote compact_code_extract_{i}.txt')
        except Exception as e:
            pass

    # Alternate format
    match2 = re.search(r'"path":\s*"[^"]*Dashboard\.jsx",\s*"contents":\s*"(.*?)"}', line, flags=re.DOTALL)
    if match2:
        content_str = match2.group(1)
        try:
            content = json.loads('"' + content_str + '"')
            if 'export default function ' in content:
                with open(f'compact_code_extract_alt_{i}.txt', 'w', encoding='utf-8') as out:
                    out.write(content)
                print(f'Wrote compact_code_extract_alt_{i}.txt')
        except Exception as e:
            pass
