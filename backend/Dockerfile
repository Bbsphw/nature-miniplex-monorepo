# =====================================================================
# Build Stage
# =====================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution file and project files for layer caching
COPY NatureMiniPlex.sln ./
COPY src/API/NatureMiniPlex.API.csproj ./src/API/
COPY src/Core/Application/NatureMiniPlex.Application.csproj ./src/Core/Application/
COPY src/Core/Domain/NatureMiniPlex.Domain.csproj ./src/Core/Domain/
COPY src/Infrastructure/NatureMiniPlex.Infrastructure.csproj ./src/Infrastructure/

# Restore dependencies
RUN dotnet restore NatureMiniPlex.sln

# Copy the remaining source files and publish
COPY . .
WORKDIR /src/src/API
RUN dotnet publish NatureMiniPlex.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# =====================================================================
# Runtime Stage
# =====================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "NatureMiniPlex.API.dll"]
