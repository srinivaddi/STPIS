import os
import sys
import subprocess
import time
import signal

backend_proc = None
frontend_proc = None

def signal_handler(sig, frame):
    print("\n[STPIS] Shutting down backend and frontend...")
    cleanup()
    sys.exit(0)

def cleanup():
    global backend_proc, frontend_proc
    if backend_proc:
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=3)
        except: pass
    if frontend_proc:
        try:
            frontend_proc.terminate()
            frontend_proc.wait(timeout=3)
        except: pass

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def launch_servers():
    global backend_proc, frontend_proc
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    print("[STPIS] Starting backend server...")
    
    # Start Backend FastAPI
    if sys.platform == "win32":
        venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
        shell = True
    else:
        venv_python = os.path.join(backend_dir, "venv", "bin", "python")
        shell = False
    
    python_cmd = venv_python if os.path.exists(venv_python) else "python"
    
    env = os.environ.copy()
    # Configure PYTHONPATH so python finds the "app" module inside "backend/" folder
    env["PYTHONPATH"] = "backend"

    backend_proc = subprocess.Popen(
        [python_cmd, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
        cwd=base_dir, # Run in base_dir so "backend" as PYTHONPATH matches folder path
        shell=shell,
        env=env
    )

    print("[STPIS] Starting frontend server...")
    # Start Frontend (Next.js/React dev server)
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )

    print("\n[STPIS] Both servers are running!")
    print(" - Backend: http://localhost:8000")
    print(" - Frontend: http://localhost:3000")
    print("Press Ctrl+C to terminate both servers safely.\n")

    # Keep script running to handle signals
    while True:
        time.sleep(1)

if __name__ == "__main__":
    try:
        launch_servers()
    except KeyboardInterrupt:
        signal_handler(None, None)
    except Exception as e:
        print(f"[STPIS] Start error: {e}")
        cleanup()
