# Shared-hosting test deployment

The application root must contain `manage.py` directly:

```text
/home/fupyqsxy/azadgozar_app/manage.py
```

Python application settings:

```text
Application root: azadgozar_app
Startup file: passenger_wsgi.py
Entry point: application
```

Use the hosting panel to define the variables from `.env.hosting.example`.
Do not upload that example as a real secret file.

After uploading the files, activate the virtual environment using the exact
command shown by the hosting panel, then run:

```bash
cd /home/fupyqsxy/azadgozar_app
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py check
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

Restart the Python application from the hosting panel after commands finish.

SQLite and Django-served media are only for temporary testing. Before public
launch, use PostgreSQL, configure the web server to serve media, set HTTPS
origins, and keep `DJANGO_DEBUG=0`.
