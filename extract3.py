import json
import os

path = r'C:\Users\Anas\.cursor\projects\c-Users-Anas-Desktop-projecto\agent-transcripts\d49cd26d-3218-4fd9-bd32-c06c812e842f\d49cd26d-3218-4fd9-bd32-c06c812e842f.jsonl'

writes = []

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            d = json.loads(line)
            
            def find_writes(obj):
                if isinstance(obj, dict):
                    if 'tool_calls' in obj:
                        for tc in obj['tool_calls']:
                            if isinstance(tc, dict):
                                name = tc.get('name') or (tc.get('function', {}).get('name'))
                                args = tc.get('arguments') or (tc.get('function', {}).get('arguments'))
                                if name and ('Write' in name):
                                    if isinstance(args, str):
                                        try:
                                            args = json.loads(args)
                                        except:
                                            pass
                                    if isinstance(args, dict) and 'Dashboard.jsx' in args.get('path', ''):
                                        writes.append(args.get('contents', ''))
                    # also handle the new generic format where tool calls are in content blocks
                    if obj.get('type') == 'tool_use':
                        name = obj.get('name')
                        if name and 'Write' in name:
                            args = obj.get('input', {})
                            if 'Dashboard.jsx' in args.get('path', ''):
                                writes.append(args.get('contents', ''))
                                
                    for k, v in obj.items():
                        if k != 'tool_calls' and k != 'input':
                            find_writes(v)
                elif isinstance(obj, list):
                    for item in obj:
                        find_writes(item)
            
            find_writes(d)
        except Exception as e:
            pass

print(f"Found {len(writes)} writes to Dashboard.jsx")
for i, w in enumerate(writes):
    with open(f"write_{i}.jsx", "w", encoding="utf-8") as out:
        out.write(w)
