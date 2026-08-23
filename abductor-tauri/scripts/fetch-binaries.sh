#!/usr/bin/env bash
set -e

# Directory where Tauri expects sidecars: src-tauri/binaries/
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$ROOT_DIR/src-tauri/binaries"
mkdir -p "$BIN_DIR"

# Detect OS and Arch
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  linux*)
    case "$ARCH" in
      x86_64) TRIPLE="x86_64-unknown-linux-gnu" ;;
      aarch64|arm64) TRIPLE="aarch64-unknown-linux-gnu" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
    FFMPEG_URL="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz"
    ;;
  darwin*)
    case "$ARCH" in
      x86_64)
        TRIPLE="x86_64-apple-darwin"
        FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-darwin-x64"
        ;;
      arm64|aarch64)
        TRIPLE="aarch64-apple-darwin"
        FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-darwin-arm64"
        ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    ;;
  msys*|mingw*|cygwin*|windows*)
    TRIPLE="x86_64-pc-windows-msvc"
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    FFMPEG_URL="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

echo "==> Fetching sidecars for target triple: $TRIPLE"

# Fetch yt-dlp
YTDLP_DEST="$BIN_DIR/yt-dlp-$TRIPLE"
if [[ "$TRIPLE" == *"windows"* ]]; then
  YTDLP_DEST="$YTDLP_DEST.exe"
fi

echo "--> Downloading yt-dlp..."
curl -L "$YTDLP_URL" -o "$YTDLP_DEST"
chmod +x "$YTDLP_DEST"
echo "✓ yt-dlp saved to $YTDLP_DEST"

# Fetch ffmpeg
FFMPEG_DEST="$BIN_DIR/ffmpeg-$TRIPLE"
if [[ "$TRIPLE" == *"windows"* ]]; then
  FFMPEG_DEST="$FFMPEG_DEST.exe"
fi

TMP_DIR="$(mktemp -d)"

echo "--> Downloading ffmpeg..."
if [[ "$FFMPEG_URL" == *.tar.xz ]]; then
  curl -L "$FFMPEG_URL" -o "$TMP_DIR/ffmpeg.tar.xz"
  tar -xf "$TMP_DIR/ffmpeg.tar.xz" -C "$TMP_DIR"
  find "$TMP_DIR" -type f -name "ffmpeg" -exec cp {} "$FFMPEG_DEST" \;
elif [[ "$FFMPEG_URL" == *.zip ]]; then
  curl -L "$FFMPEG_URL" -o "$TMP_DIR/ffmpeg.zip"
  unzip -q "$TMP_DIR/ffmpeg.zip" -d "$TMP_DIR"
  if [[ "$TRIPLE" == *"windows"* ]]; then
    find "$TMP_DIR" -type f -name "ffmpeg.exe" -exec cp {} "$FFMPEG_DEST" \;
  else
    find "$TMP_DIR" -type f -name "ffmpeg" -exec cp {} "$FFMPEG_DEST" \;
  fi
else
  # Direct static binary download (e.g. macOS ffmpeg-static)
  curl -L "$FFMPEG_URL" -o "$FFMPEG_DEST"
fi

chmod +x "$FFMPEG_DEST"
rm -rf "$TMP_DIR"
echo "✓ ffmpeg saved to $FFMPEG_DEST"

echo "==> All sidecars ready in $BIN_DIR"
