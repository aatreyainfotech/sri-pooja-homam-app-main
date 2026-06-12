#!/bin/bash
# Azure App Service startup script
echo "=== Sri Pooja Homam Backend Starting ==="
cd /home/site/wwwroot
exec gunicorn -c gunicorn.conf.py application:app
