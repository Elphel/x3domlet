#!/bin/bash
set -e

echo checking for installed node version
node --version && exit

echo get latest nvm release number ... 
NVM_VERSION=$(git ls-remote --tags https://github.com/creationix/nvm master v\* | sed -r -n -e 's/.*(v[0-9\.]+)$/\1/p' | sort -V | tail -n 1)

echo downloading nvm $NVM_VERSION
# download nvm installer
wget -q -O /tmp/install.sh https://raw.githubusercontent.com/creationix/nvm/$NVM_VERSION/install.sh

echo installing nvm
. /tmp/install.sh
export NVM_DIR="$HOME/.nvm"
test -s "$NVM_DIR/nvm.sh"
. "$NVM_DIR/nvm.sh"

echo get latest node LTS release number
NODE_VERSION=$(nvm ls-remote | grep LTS | tail -n 1 | sed -r -n -e 's/.*(v[0-9\.]+).*/\1/p')

echo install nodejs
nvm install $NODE_VERSION

# disable npm progress
touch $HOME/.npmrc
grep -q progress= $HOME/.npmrc || echo progress=false >> $HOME/.npmrc

echo install latest npm
npm install -g npm

echo done
