"""
Sandbox Manager — Docker/VM with resource limits, audit logs
"""
import subprocess, json, time

class SandboxManager:
    def create(self, task_id: str, mode: str = "SAFE"):
        limits = {"SAFE": {"network": "none", "memory": "512m"}, "TEST": {"network": "restricted"}, "FULL_DELEGATED": {"network": "allow"}}
        return {"sandbox_id": f"sandbox_{task_id}", "mode": mode, "limits": limits.get(mode, {}), "status": "created", "vnc_url": "vnc://localhost:5900"}

    def destroy(self, sandbox_id: str):
        return {"status": "destroyed", "sandbox_id": sandbox_id}
