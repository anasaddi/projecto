import json
import re

path = r'C:\Users\Anas\.cursor\projects\c-Users-Anas-Desktop-projecto\agent-transcripts\d49cd26d-3218-4fd9-bd32-c06c812e842f\d49cd26d-3218-4fd9-bd32-c06c812e842f.jsonl'
lines = []
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'border-[1.5px]' in line or 'text-[9px]' in line or 'w-24 h-24' in line:
            lines.append(line)

print('Found ' + str(len(lines)) + ' lines')

for i, line in enumerate(lines):
    # Just extract anything inside contents
    match = re.search(r'"contents":\s*"(.*?)",\s*"path"', line)
    if match:
        content = match.group(1)
        try:
            content = json.loads('"' + content + '"')
            if 'export default function Dashboard' in content:
                with open('compact_code_' + str(i) + '.txt', 'w', encoding='utf-8') as out:
                    out.write(content)
                print('Wrote compact_code_' + str(i) + '.txt')
        except:
            pass
    # alternate format
    match2 = re.search(r'"path":\s*"[^"]*Dashboard\.jsx",\s*"contents":\s*"(.*?)"}', line)
    if match2:
        content = match2.group(1)
        try:
            content = json.loads('"' + content + '"')
            if 'export default function Dashboard' in content:
                with open('compact_code_alt_' + str(i) + '.txt', 'w', encoding='utf-8') as out:
                    out.write(content)
                print('Wrote compact_code_alt_' + str(i) + '.txt')
        except:
            pass
