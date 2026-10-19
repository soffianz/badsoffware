#!/bin/bash
# Publish the current index.html to the gh-pages branch (GitHub Pages serves it at https://<user>.github.io/<repo>/)
set -e
cd "$(git rev-parse --show-toplevel)"
SRC=$(git rev-parse --abbrev-ref HEAD); T=$(mktemp -d)
git fetch -q origin gh-pages
git worktree add -q "$T" origin/gh-pages --detach
cp index.html "$T/index.html"
cd "$T" && git add -A && (git diff --cached --quiet && echo "nothing to deploy" || { git commit -q -m "Deploy from $SRC"; git push -q origin HEAD:gh-pages; echo deployed; })
cd - >/dev/null && git worktree remove --force "$T"
