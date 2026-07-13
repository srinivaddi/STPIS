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

    # Wait for ports to be responsive before opening the browser
    def wait_for_port(port: int, timeout: float = 60.0) -> bool:
        import socket
        start_time = time.time()
        while True:
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=1.0):
                    return True
            except (socket.timeout, ConnectionRefusedError):
                if time.time() - start_time > timeout:
                    return False
                time.sleep(0.5)

    print("\n[STPIS] Waiting for backend (8000) and frontend (3000) servers to boot...")
    backend_ready = wait_for_port(8000)
    frontend_ready = wait_for_port(3000)

    if backend_ready and frontend_ready:
        print("\n[STPIS] Both servers are running and fully responsive!")
        print(" - Backend: http://localhost:8000")
        print(" - Frontend: http://localhost:3000")
        print("[STPIS] Launching web browser at http://localhost:3000/ ...\n")
        import webbrowser
        webbrowser.open("http://localhost:3000/")
    else:
        print("\n[STPIS] Warning: Timed out waiting for servers to become responsive.")

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
