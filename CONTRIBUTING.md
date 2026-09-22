# Contributing

## Tests

Run tests with the following:

    npm test

Or a specific test:

    npm test -- --test-name-pattern="TEST_NAME"

### Adding tests

Easily download metadata like so:

    curl -LH 'accept: application/vnd.citationstyles.csl+json' https://doi.org/$DOI | jq '[.]' > test/$TEST_NAME.json

Then, add a test in `test/suite.js`.
