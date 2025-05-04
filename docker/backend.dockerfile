FROM python:3.8

WORKDIR /app/backend

COPY backend/* .

RUN pip install --upgrade pip
RUN pip install -r requirement.txt

CMD [ "python", "main.py" ]
