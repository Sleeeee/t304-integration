FROM python:3.13-alpine

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
