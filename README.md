# Lease

A smart contract for a rental lease

## TO-DO

- leverage a time library to obtain actual (not 30-day-based) months
- deploy the stateless library Logic.sol to a specific address in each testnet, so that it doesn't need to be redeployed on each contract creation; store the addresses in a separate file
- refactor the test suite so it performs all the checks by listening to events; this should allow it to be run on testnets flawlessly

## DONE

- a test script that reinitializes ganache-cli on each test run
- remove the max cap on the termination time and allow owner and tenant to create shorter termination times