FROM node:buster

RUN apt update && \
    apt install -y curl unzip xvfb libxi6 libgconf-2-4 && \
    curl https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb >> chrome.deb && \
    apt install ./chrome.deb -y && \
    unlink ./chrome.deb
