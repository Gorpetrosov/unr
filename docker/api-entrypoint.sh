#!/bin/sh
# Prefer blog-backend/docker-entrypoint.sh (used by the API image).
# This file is kept for documentation parity with the project plan.
exec /usr/local/bin/docker-entrypoint.sh "$@"
