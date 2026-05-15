$env:GIT_ASKPASS = "echo"
$env:GCM_INTERACTIVE = "Never"
$env:GIT_TERMINAL_PROMPT = "0"
cd "c:\Users\Anas\Desktop\projecto"
git add . 2>&1 | Out-Null
git commit -m "fix(backend): auto-create shared dashboard v3 - return direct response" 2>&1 | Out-Null
git push origin main 2>&1
