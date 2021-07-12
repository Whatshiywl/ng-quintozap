#! /bin/sh
set -e

# Prepare environment
apt update
apt install -y curl unzip xvfb libxi6 libgconf-2-4
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install ./google-chrome-stable_current_amd64.deb -y
unlink ./google-chrome-stable_current_amd64.deb

# Perform tests
ng test --watch false
