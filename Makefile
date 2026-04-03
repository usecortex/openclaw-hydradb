.DEFAULT_GOAL := help

.PHONY: help bootstrap install check-types test clean

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

bootstrap: ## Run full project bootstrap (install deps, type-check, create .env)
	@bash scripts/bootstrap.sh

install: ## Install dependencies (npm ci)
	npm ci

check-types: ## Run TypeScript type-checking
	npm run check-types

test: ## Run tests (if configured)
	@npm test || echo "No test script configured in package.json"

clean: ## Remove generated artifacts and dependencies
	rm -rf node_modules/ dist/
