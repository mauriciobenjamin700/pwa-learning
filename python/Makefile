install:
	poetry install

dev:
	poetry run uvicorn src.api.app:app --reload --port 3001

start:
	poetry run uvicorn src.api.app:app --host 0.0.0.0 --port 3001

lint:
	poetry run ruff check src
	poetry run mypy src

format:
	poetry run ruff format src
	poetry run ruff check --fix src

clean:
	rm -rf .venv data/*.db __pycache__ .mypy_cache .ruff_cache
