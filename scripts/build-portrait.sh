#!/bin/sh
# Rebuild the website's portrait icons and social image from the real photo.
# This optional step requires ImageMagick; the generated assets are checked in.
set -eu
cd "$(dirname "$0")/.."

if ! command -v convert >/dev/null 2>&1; then
  echo 'ImageMagick (convert) is required to regenerate the portrait assets.' >&2
  exit 1
fi

for size in 48 192; do
  convert Me.jpg -auto-orient -filter Lanczos -resize "${size}x${size}^" \
    -gravity center -extent "${size}x${size}" -strip "PNG24:images/portrait-icon-${size}.png"
done
convert Me.jpg -auto-orient -filter Lanczos -resize '180x180^' \
  -gravity center -extent 180x180 -strip PNG24:images/portrait-touch-180.png

# Keep the portrait centered for both wide and square social-preview crops.
# Feather its side edges into a neutral background without altering the face.
convert -size 1200x630 xc:'#e9e9e9' \
  \( Me.jpg -auto-orient -filter Lanczos -resize '630x630^' -gravity center -extent 630x630 \
     \( -size 630x630 xc:black -fill white -draw 'rectangle 60,0 570,629' -blur 0x35 \) \
     -alpha off -compose CopyOpacity -composite \) \
  -gravity center -compose over -composite -strip -quality 90 images/portrait-share.jpg
