# E2E tests for ogx agentic template

Basic test suite that to verify the lls agentic app template runs and creates the appropriate resources.

## Requirements

To run the test suite, you will need the following:
 - nodejs (version 22+ preferably)
 - oc/kubectl cli tool
 - Running cluster with:
   - RHDH/backstage instance
     - including a configured static token (or disabled API authentication if you like to live dangerously)
   - ArgoCD/Gitops instance
   - Pipelines operator

## Running the tests

First, install the dependencies:
```
$ npm install
```

Log in to your cluster using `oc` or `kubectl`. 

Copy the `.env-template` file as `.env`, and fill in the environment variables within.

Source the `.env` file.

Run the tests:
```
$ npm test
```
