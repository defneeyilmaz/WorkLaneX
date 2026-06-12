FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY WorkLaneX.slnx ./
COPY src/WorkLaneX.Api/WorkLaneX.Api.csproj src/WorkLaneX.Api/
COPY src/WorkLaneX.Application/WorkLaneX.Application.csproj src/WorkLaneX.Application/
COPY src/WorkLaneX.Domain/WorkLaneX.Domain.csproj src/WorkLaneX.Domain/
COPY src/WorkLaneX.Infrastructure/WorkLaneX.Infrastructure.csproj src/WorkLaneX.Infrastructure/

RUN dotnet restore src/WorkLaneX.Api/WorkLaneX.Api.csproj

COPY src/ src/

RUN dotnet publish src/WorkLaneX.Api/WorkLaneX.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "WorkLaneX.Api.dll"]
