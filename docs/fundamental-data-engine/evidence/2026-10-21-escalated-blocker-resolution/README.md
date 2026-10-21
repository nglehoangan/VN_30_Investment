# Escalated blocker resolution

Start with FINAL_REVIEW.md and OWNER_DECISION_PACKET.md. Implementation is evidence-only, not activated. Persistent register: docs/fundamental-data-engine/ESCALATION_REGISTER.json. Evidence checkpoint is immutable after ARTIFACT_HASHES.json. Reproduce pre-seal with verify-engineering.mjs, build-evidence.py, sequential run-quality-gates.py, then finalize-evidence.py. These scripts reject sealed output. No production mutation, CAS or scoring.
