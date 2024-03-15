#!/bin/bash

DOCS_PORT="${DOCS_PORT:-8080}"  # Uses DOCS_PORT from enviroment if exists, otherwise 8080

# Automatically recompile html files on change and launch browser at specified port
sphinx-autobuild --port ${DOCS_PORT} --host 0.0.0.0 monai-cloud-api build/html
