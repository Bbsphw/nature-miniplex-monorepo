#!/bin/bash
dotnet tool install --global dotnet-ef || true
export PATH="$PATH:$HOME/.dotnet/tools"
cd ~/nature-miniplex-monorepo/backend/src/API
dotnet ef migrations add InitialMigration --project ../Infrastructure --startup-project .
dotnet ef database update --project ../Infrastructure --startup-project .
