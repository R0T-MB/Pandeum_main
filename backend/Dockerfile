FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app
COPY alembic.ini .
COPY ./alembic ./alembic

ENV PYTHONPATH=/app

# Aplicar migraciones antes de arrancar para que el esquema esté siempre al día
# (evita 500 por columnas faltantes, p.ej. rejection_* en providers).
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]