#!/bin/bash
if which yarn >/dev/null; then
  echo "node/yarn is already installed"
else
  echo "installing yarn..."
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
  apt update
  apt-get install yarn -y
fi

if which nginx >/dev/null; then
  echo "nginx is already installed"
else
  apt-get install nginx -y
fi
