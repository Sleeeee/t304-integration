FROM python:3.13-alpine

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
