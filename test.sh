#! /bin/bash

if nc -z localhost 8545; then
    echo "using existing Ethereum RPC..."
    own=false
else
    echo "starting ganache-cli..."
    own=true
    ganache-cli > /dev/null &
fi

truffle test

if $own; then
    echo "killing ganache-cli..."
    fuser -k 8545/tcp
fi
