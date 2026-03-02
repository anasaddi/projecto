import json

path = r'C:\Users\Anas\.cursor\projects\c-Users-Anas-Desktop-projecto\agent-transcripts\d49cd26d-3218-4fd9-bd32-c06c812e842f\d49cd26d-3218-4fd9-bd32-c06c812e842f.jsonl'
lines = []
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'border-[1.5px]' in line or 'text-[9px]' in line or 'w-24 h-24' in line:
            lines.append(line)

print('Found ' + str(len(lines)) + ' lines')

def find_contents(obj):
    if isinstance(obj, dict):
        # The new tool call format might be inside 'input' field instead of 'arguments' string
        if obj.get('name') == 'default_api:Write' and 'input' in obj:
            inp = obj['input']
            if isinstance(inp, dict) and 'contents' in inp and 'Dashboard.jsx' in str(inp.get('path', '')):
                return inp['contents']
        
        # Standard tool_calls format
        if 'tool_calls' in obj:
            for tc in obj['tool_calls']:
                if isinstance(tc, dict):
                    args = tc.get('arguments', {})
                    if isinstance(args, str):
                        try: args = json.loads(args)
                        except: pass
                    if isinstance(args, dict) and 'contents' in args and 'Dashboard.jsx' in str(args.get('path', '')):
                        return args['contents']
        
        # Recursion
        for k, v in obj.items():
            res = find_contents(v)
            if res: return res
    elif isinstance(obj, list):
        for item in obj:
            res = find_contents(item)
            if res: return res
    return None

for i, line in enumerate(lines):
    try:
        data = json.loads(line)
        content = find_contents(data)
        if content and 'export default function ' in content:
            with open('compact_code_' + str(i) + '.txt', 'w', encoding='utf-8') as out:
                out.write(content)
            print('Wrote compact_code_' + str(i) + '.txt')
    except Exception as e:
        pass
