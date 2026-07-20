#!/bin/bash
export PATH="/home/khingg/.dotnet/tools:$PATH"
cd /home/khingg/nature-miniplex-monorepo/backend

echo "=== Dropping Database ==="
dotnet ef database drop --project src/Infrastructure --startup-project src/API --force

echo "=== Applying Migrations ==="
dotnet ef database update --project src/Infrastructure --startup-project src/API

echo "=== Done! Database reset complete. Backend will seed on next startup. ==="
