#! /bin/bash

if nc -z localhost 8875; then
    echo "using existing Ethereum RPC on port 8875..."
    own=false
else
    echo "starting ganache-cli on port 8875..."
    own=true
    ganache-cli -p 8875 &> /dev/null &
fi

truffle test --network dev

if $own; then
    echo "killing ganache-cli..."
    fuser -k 8875/tcp
fi
