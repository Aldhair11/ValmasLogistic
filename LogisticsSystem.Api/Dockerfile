FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY LogisticsSystem.Domain/*.csproj         LogisticsSystem.Domain/
COPY LogisticsSystem.Application/*.csproj    LogisticsSystem.Application/
COPY LogisticsSystem.Infrastructure/*.csproj LogisticsSystem.Infrastructure/
COPY LogisticsSystem.Api/*.csproj            LogisticsSystem.Api/

RUN dotnet restore LogisticsSystem.Api/LogisticsSystem.Api.csproj

COPY LogisticsSystem.Domain/         LogisticsSystem.Domain/
COPY LogisticsSystem.Application/    LogisticsSystem.Application/
COPY LogisticsSystem.Infrastructure/ LogisticsSystem.Infrastructure/
COPY LogisticsSystem.Api/            LogisticsSystem.Api/

RUN dotnet publish LogisticsSystem.Api/LogisticsSystem.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/data

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health > /dev/null 2>&1 || exit 1

ENTRYPOINT ["dotnet", "LogisticsSystem.Api.dll"]
