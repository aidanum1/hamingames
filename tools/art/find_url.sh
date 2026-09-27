#!/bin/bash
# find_url.sh <job_id> <HHMMSS_start> <HHMMSS_end> [date] — probe the Higgsfield CDN for a finished job's PNG
J=$1; S=$2; E=$3; D=${4:-20260927}
U=https://d8j0ntlcm91z4.cloudfront.net/user_3AvdTV4QzMGevLsVk5Y1D7eAOpH
t=$(date -j -f "%H%M%S" "$S" +%s); e=$(date -j -f "%H%M%S" "$E" +%s)
while [ $t -le $e ]; do
  hms=$(date -j -r $t +%H%M%S)
  url="$U/hf_${D}_${hms}_${J}.png"
  code=$(curl -s -o /dev/null -w "%{http_code}" -I "$url")
  if [ "$code" = "200" ]; then echo "$url"; exit 0; fi
  t=$((t+1))
done
echo "NOTFOUND $J" >&2; exit 1
