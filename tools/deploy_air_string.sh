#!/bin/bash
# Publish air-string/ to the gh-pages branch (served at https://<user>.github.io/<repo>/air-string/). Leaves the game's index.html alone.
set -e
cd "$(git rev-parse --show-toplevel)"
SRC=$(git rev-parse --abbrev-ref HEAD); T=$(mktemp -d)
git fetch -q origin gh-pages
git worktree add -q "$T" origin/gh-pages --detach
mkdir -p "$T/air-string" && cp air-string/index.html "$T/air-string/index.html"
cd "$T" && git add -A && (git diff --cached --quiet && echo "nothing to deploy" || { git commit -q -m "Deploy Air String from $SRC"; git push -q origin HEAD:gh-pages; echo deployed; })
cd - >/dev/null && git worktree remove --force "$T"
