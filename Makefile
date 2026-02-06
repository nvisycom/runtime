# Makefile for the Nvisy runtime monorepo.

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Shell-level logger (expands to a printf that runs in the shell).
define log
printf "[%s] [MAKE] [$(MAKECMDGOALS)] $(1)\n" "$$(date '+%Y-%m-%d %H:%M:%S')"
endef

WATCH_PATHS := $(foreach p,$(wildcard packages/*/dist),--watch-path=$(p))

.PHONY: dev
dev: ## Starts build watchers and dev server concurrently.
	@for pkg in packages/*/; do \
		npm run build:watch --workspace=$$pkg & \
	done; \
	node $(WATCH_PATHS) packages/nvisy-server/dist/main.js & \
	wait

.PHONY: ci
ci: ## Runs all CI checks locally (lint, typecheck, test, build).
	@$(call log,Running lint...)
	@npx biome check .
	@$(call log,Running typecheck...)
	@npx tsc -b packages/*/tsconfig.json
	@$(call log,Running tests...)
	@npx vitest run --coverage
	@$(call log,Running build...)
	@npm run build --workspaces --if-present
	@$(call log,All CI checks passed!)

.PHONY: clean
clean: ## Removes all build artifacts and node_modules.
	@$(call log,Cleaning build artifacts...)
	@npx tsc -b --clean packages/*/tsconfig.json
	@rm -rf packages/*/dist
	@$(call log,Removing node_modules...)
	@rm -rf node_modules packages/*/node_modules package-lock.json
	@$(call log,Clean complete.)

.PHONY: docker
docker: ## Builds the Docker image.
	@$(call log,Building Docker image...)
	@docker build -f docker/Dockerfile -t nvisy-runtime .
	@$(call log,Docker image built.)
