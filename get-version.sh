#! /bin/sh
set -e

cat package.json | grep version | sed -e 's#\s*"version":\s*"\([^"]*\)",\?\s*#\1#g'
