#!/bin/sh
# Cambia la versione dell'app in TUTTI i posti che devono coincidere:
#   sw.js (APP_VERSION → nome della cache e ?v= del precache), js/modules/utils.js (GT.APP_VERSION),
#   js/app/main.js (versione attesa dalla guardia), index.html (?v= di ogni CSS e JS).
# Uso: scripts/versione.sh 2.0.1
set -eu
cd "$(dirname "$0")/.."
NEW="${1:?uso: scripts/versione.sh X.Y.Z}"
echo "$NEW" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || { echo "versione non valida: $NEW" >&2; exit 2; }

perl -pi -e "s/^const APP_VERSION = '[^']*';/const APP_VERSION = '$NEW';/" sw.js
perl -pi -e "s/APP_VERSION: 'v[^']*'/APP_VERSION: 'v$NEW'/" js/modules/utils.js
perl -pi -e "s/^const GT_EXPECTED_VERSION = 'v[^']*';/const GT_EXPECTED_VERSION = 'v$NEW';/" js/app/main.js
perl -pi -e "s/\?v=[0-9]+\.[0-9]+\.[0-9]+/?v=$NEW/g" index.html

grep -q "const APP_VERSION = '$NEW';" sw.js
grep -q "APP_VERSION: 'v$NEW'" js/modules/utils.js
grep -q "GT_EXPECTED_VERSION = 'v$NEW'" js/app/main.js
OLD_LEFT=$(grep -Eo '\?v=[0-9.]+' index.html | grep -vc "?v=$NEW" || true)
[ "$OLD_LEFT" = "0" ] || { echo "index.html ha ancora $OLD_LEFT URL con un'altra versione" >&2; exit 1; }
echo "versione $NEW: sw.js, utils.js, main.js, index.html ($(grep -c "?v=$NEW" index.html) URL)"
