# TODO

1. Make good README

# Basic Usage

node mutli-get.js <url> [filename=out] [num=4] [size=1048576]

num and size must be positive non-zero integers

To avoid sending too many requests to the server, num must be below 1000.

# Files

## multi-get.js

The main application; see above for usage.

## test.sh

A small bash script useful for manual testing. Tiny and not needed for
running.
