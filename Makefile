.PHONY: build up down logs ps restart clean

# Build all services
build:
	docker compose -f infra/docker-compose.yml build

# Start all services (detached)
up:
	docker compose -f infra/docker-compose.yml up -d

# Stop all services
down:
	docker compose -f infra/docker-compose.yml down

# View logs (follow)
logs:
	@echo "Usage: make logs SERVICE=<service-name>"
	@echo "Available services: api-gateway, auth-service, operations-service, tracking-service, postgres, redis"
	docker compose -f infra/docker-compose.yml logs -f $(SERVICE)

# View running services
ps:
	docker compose -f infra/docker-compose.yml ps

# Restart a service
restart:
	@echo "Usage: make restart SERVICE=<service-name>"
	docker compose -f infra/docker-compose.yml restart $(SERVICE)

# Stop and remove containers, volumes, networks
clean:
	docker compose -f infra/docker-compose.yml down -v --remove-orphans

# Start only infrastructure (postgres, redis)
infra-up:
	docker compose -f infra/docker-compose.yml up -d postgres redis

# Stop only infrastructure
infra-down:
	docker compose -f infra/docker-compose.yml stop postgres redis

 