#!/usr/bin/env node

require('babel-register')({ 'presets': ['es2015'] });

require('./create.es6');
