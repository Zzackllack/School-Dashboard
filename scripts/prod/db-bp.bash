CID="backend-v0coks8ogocswg4w8og8cccg-170115833761"
TS="$(date +%Y%m%d-%H%M%S)"
OUT="$HOME/h2-backups/$TS"
mkdir -p "$OUT"

# Confirm DB file exists
docker exec "$CID" sh -lc 'ls -lah /data && test -f /data/substitution-plans.mv.db && echo "DB file found"'

# Consistent binary backup (brief downtime)
docker stop "$CID"
docker cp "$CID:/data/substitution-plans.mv.db" "$OUT/"
docker cp "$CID:/data/substitution-plans.trace.db" "$OUT/" 2>/dev/null || true
docker start "$CID"

# Verify
ls -lh "$OUT"
sha256sum "$OUT"/*
