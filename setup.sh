#!/bin/bash
# Setup script to add DUK bin directory to PATH and enable bash completion
# Usage: source setup.sh [--install]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/scripts/bin"
COMPLETION_FILE="$SCRIPT_DIR/scripts/utils/duk-completion.bash"

if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    export PATH="$BIN_DIR:$PATH"
    echo "✅ Added $BIN_DIR to PATH for this session"
else
    echo "ℹ️  $BIN_DIR already in PATH"
fi

if [ -f "$COMPLETION_FILE" ]; then
    source "$COMPLETION_FILE"
    echo "✅ Loaded bash completion for this session"
fi

if [[ "$1" == "--install" ]]; then
    "$BIN_DIR/duk-install" --setup
fi

echo ""
echo "✨ DUK commands are ready with tab completion:"
echo "   duk-install [--clean] [--setup] - Install deps (--setup: add to ~/.bashrc)"
echo "   duk-build [check]              - Build into dist/ (check: typecheck+lint+tests first)"
echo "   duk-publish [--check] [--yes]  - Build and publish to GitHub Pages"
echo "   duk-run [dev|preview|test]     - Start dev server, preview build, or watch tests"
if [[ "$1" != "--install" ]]; then
    echo ""
    echo "💡 Run 'source setup.sh --install' to add permanently to .bashrc"
fi
