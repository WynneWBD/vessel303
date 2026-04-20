#!/usr/bin/env bash
# Batch-embed IPTC/EXIF copyright metadata into VESSEL image assets.
# Requires: exiftool (brew install exiftool)
#
# Usage:
#   bash scripts/embed-copyright.sh public              # deployed images only
#   bash scripts/embed-copyright.sh assets              # raw archive only
#   bash scripts/embed-copyright.sh all                 # both

set -euo pipefail

SCOPE="${1:-all}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$REPO_ROOT/public/images"
ASSETS_DIR="$REPO_ROOT/vessel303-assets"

YEAR="2026"
COPYRIGHT="© $YEAR VESSEL 微宿® · Guangdong Vessel Cultural Tourism Development Co., Ltd."
CREATOR="VESSEL 微宿® / Guangdong Vessel Cultural Tourism Development Co., Ltd."
NOTICE="All rights reserved. Unauthorized use prohibited. Contact vessel.sale@303industries.cn for licensing."
RIGHTS="All rights reserved"
URL="https://vessel303.com"
CONTACT="vessel.sale@303industries.cn"

stamp() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    echo "SKIP: $dir (not found)"
    return 0
  fi

  echo "== Stamping: $dir"
  # -overwrite_original: modify in place, no _original backup files
  # -P: preserve file modification date
  # -r: recurse
  # -ext: process each common format
  exiftool \
    -overwrite_original \
    -P \
    -r \
    -ext jpg -ext jpeg -ext png -ext webp -ext tif -ext tiff \
    -Copyright="$COPYRIGHT" \
    -IPTC:CopyrightNotice="$NOTICE" \
    -IPTC:By-line="$CREATOR" \
    -IPTC:Credit="VESSEL 微宿®" \
    -IPTC:Source="vessel303.com" \
    -IPTC:Contact="$CONTACT" \
    -XMP-dc:Creator="$CREATOR" \
    -XMP-dc:Rights="$RIGHTS" \
    -XMP-xmpRights:Marked=True \
    -XMP-xmpRights:WebStatement="$URL" \
    -XMP-xmpRights:UsageTerms="$NOTICE" \
    -EXIF:Copyright="$COPYRIGHT" \
    -EXIF:Artist="$CREATOR" \
    "$dir" || true
  return 0
}

case "$SCOPE" in
  public) stamp "$PUBLIC_DIR" ;;
  assets) stamp "$ASSETS_DIR" ;;
  all)
    stamp "$PUBLIC_DIR"
    stamp "$ASSETS_DIR"
    ;;
  *)
    echo "Unknown scope: $SCOPE (use: public | assets | all)"
    exit 1
    ;;
esac

echo "== Done. Verify on one file: exiftool -Copyright -Creator <path>"
