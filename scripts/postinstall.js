#!/usr/bin/env node
var shelljs=require('shelljs');
if (!shelljs.which('php-cgi')) {
  console.log('php-cgi not found. Maybe you can install it with:');
  console.log('sudo apt-get install php5-cgi');
  process.exit(1);
}
