#!/bin/sh
set -e

mkdir -p /data
chown -R app:app /data

if [ "$#" -eq 0 ]; then
  set -- java -jar /app/app.jar
fi

if [ "$1" = "java" ] && [ -n "$JAVA_OPTS" ]; then
  shift
  set -- java $JAVA_OPTS "$@"
fi

exec su-exec app "$@"
