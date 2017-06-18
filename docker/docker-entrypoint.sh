#!/bin/bash
export NVM_DIR="/home/elphel/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
exec "$@"

