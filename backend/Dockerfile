FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DATABASE_PATH=/data/trace.db MODEL_DIR=/app/artifacts
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY tests ./tests
RUN python -m app.model && useradd --uid 10001 --create-home trace && mkdir -p /data && chown -R trace:trace /data /app/artifacts
USER trace
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
