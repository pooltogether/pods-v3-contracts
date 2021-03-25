#!/bin/sh

MNEMONIC=$(grep MNEMONIC ./.env | cut -d '=' -f 2-)
ganache-cli --db="./data/save/" -d -m $MNEMONIC