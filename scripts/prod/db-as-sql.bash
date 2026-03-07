cd "$OUT"
curl -fL -o h2.jar https://repo1.maven.org/maven2/com/h2database/h2/2.4.240/h2-2.4.240.jar

java -cp h2.jar org.h2.tools.Script \
  -url "jdbc:h2:file:$OUT/substitution-plans" \
  -user "sa" \
  -password "" \
  -script "$OUT/substitution-plans-backup.sql"

ls -lh "$OUT"/substitution-plans-backup.sql
