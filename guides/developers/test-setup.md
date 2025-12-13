# Test Setup in Phoenix

- [Introduction](#introduction)
- [Unit Tests in Phoenix](#unit-tests-in-phoenix)
  - [Unit Test Syntax in Jest Example](#unit-test-syntax-in-jest-example)
  - [Jest Configuration](#jest-configuration)
- [E2E Tests in Phoenix](#e2e-tests-in-phoenix)
  - [E2E Test Syntax in Cypress Example](#e2e-test-syntax-in-cypress-example)
  - [Cypress Configuration](#cypress-configuration)
- [Running tests locally](#running-the-tests-locally)
- [Fixing problems](#fixing-problems)

## Introduction

Phoenix has 2 types of tests: [unit tests](https://en.wikipedia.org/wiki/Unit_testing) and [end-to-end tests](https://www.browserstack.com/guide/end-to-end-testing). In essence, Unit tests are written to test individual components of the project which includes the [phoenix-event-display](https://github.com/HSF/phoenix/blob/main/packages/phoenix-event-display/README.md) library and the Angular components used by the Phoenix application inside [phoenix-ng](https://github.com/HSF/phoenix/tree/main/packages/phoenix-ng/) package, while the end-to-end tests are used to test user interactions with the [Phoenix application](https://github.com/HSF/phoenix/blob/main/packages/phoenix-ng/projects/phoenix-app/).

## Unit Tests in Phoenix

While writing unit tests, we make sure to follow these practices:

1. We focus on testing the functionality of the underlying code and not on the code coverage. We believe code coverage is achieved as a by-product of writing good tests. Unit tests are not written to reach a certain code coverage percentage, they are written to test the behavior of a unit (class, function, etc). If we test the behaviors properly, we will automatically have high code coverage.
2. We try not to duplicate implementation logic in the tests as errors may repeat if our tests mirror the implementation logic.
3. We try to keep the tests as simple as possible and you can find them ending with the extension `.test.ts`. We try to avoid using complex logic in the tests as it may be difficult to debug and maintain.
4. We try to keep the tests as readable as possible. We use the `it('<should work as expected>', () => {})` syntax to write the description of a test and make sure that it is clear enough as to what is being tested. Inside the test cases, you can use either the [AAA (Arrange, Act, Assert)](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/) or [GWT (Given, When, Then)](https://martinfowler.com/bliki/GivenWhenThen.html) pattern to clearly define the phases of your test case. We should test "what" the function does instead of "how" it does it.
5. We have to make sure that the tests are deterministic and not flaky. Flaky tests are tests that fail intermittently and are difficult to debug, i.e., the tests we write should always present the same behavior. For this, each test case has to be isolated and independent of the other test cases.
6. Since Phoenix uses `WebGLRenderer` extensively, we make sure to mock it whenever we are using it inside our tests. This is because [WebGLRenderer](https://threejs.org/docs/#api/en/renderers/WebGLRenderer) is not supported by [jsdom](https://jestjs.io/docs/configuration#testenvironment-string) due to non-availability of `WebGLContext` in Node.js and the browserless nature of `jsdom` and hence, we mock it using our custom helper [`webgl-mock.ts`](https://github.com/HSF/phoenix/blob/main/packages/phoenix-event-display/src/tests/helpers/webgl-mock.ts).
7. The code we are supposed to test should not be mocked. We should mock the code that is not supposed to be tested. For example, if we are testing the `EventDisplay` class, we should not mock the `EventDisplay` class, but we should mock the `WebGLRenderer` class as it is not supposed to be tested in this case.
8. `Constants` are not tested separately. Testing the code that uses those constants should be sufficient. `Types` are not tested as they don't contain any logic that has to be tested.
9. We should avoid having assertions that have nothing to do with the test case and the code to be tested. Proper usage of assertions is important to make sure that the test case is testing just the right thing. For example, if we are testing a function that returns a [Group](https://threejs.org/docs/#api/en/objects/Group), we can check if the correct objects exist inside it. And then we can check if the objects are instances of the correct class and have the correct properties, etc.
10. `toBeTruthy` and `toBe(true)` are not the same. `toBeTruthy` checks if the value is truthy, i.e., it checks if the value is not `null`, `undefined`, `0`, `false`, `NaN`, or an empty string. `toBe(true)` checks if the value is exactly `true` as it calls `Object.is` to compare values. Make sure to do the [Setup and Teardown](https://jestjs.io/docs/setup-teardown) of the test cases properly. For example, if we are testing a function that adds an object to a list, we should make sure to remove the object from the list after the test case is executed. This is because the test cases are executed in parallel and if we don't remove the object from the list, it may affect the other test cases.
11. To debug when the tests fail, just check the console for the `expected` and `actual` values as Jest provides rich context. If the values are not what you expect, you can use the `console.log` statements to debug the code as well.

### Unit Test Syntax in Jest Example

```
describe('ClassName', () => {
  it('should create an instance', () => {
    const className = new ClassName();
    expect(className).toBeTruthy();
  });
});
```

Some simple examples of unit tests written in TypeScript using Jest:

- [info-logger.test.ts](https://github.com/HSF/phoenix/blob/main/packages/phoenix-event-display/src/tests/helpers/info-logger.test.ts)
- [file-explorer.component.test.ts](https://github.com/HSF/phoenix/blob/main/packages/phoenix-ng/projects/phoenix-ui-components/lib/components/file-explorer/file-explorer.component.test.ts)

### Jest Configuration

The configuration file for Jest inside `phoenix-event-display` is [jest.conf.js](https://github.com/HSF/phoenix/blob/main/packages/phoenix-event-display/configs/jest.conf.js) and the configuration file for Jest inside `phoenix-ng` is [jest.conf.js](https://github.com/HSF/phoenix/blob/main/packages/phoenix-ng/jest.config.js). Both require slightly different configurations so we decided not to merge them.

To learn more about Jest and related documentation, we recommend you check out the following links:

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Jest API](https://jestjs.io/docs/api)

## E2E Tests in Phoenix

While writing end-to-end tests, we make sure to follow these practices:

1. We utilized visual (screenshot) testing a lot in each experiment with a minimum of 1 screenshot covering each experiment except in the case of `CMSComponent` where we have multiple screenshots to test the different user-specific scenarios.
2. We make sure that we are taking screenshots only if something changes on the event display as it is rendered on a canvas and we can't really assert anything otherwise. We can also check if the expected elements exist (not all but only 2-3 elements) in the DOM.
3. We avoid using common classes like `.btn-primary` to access an element as it may change in the future if someone introduces a new button and the test will immediately break. We should either find a more suitable selector that will not change or add `data-testid` attribute to elements so that they can be queried in tests individually.
4. Most of the tests inside the `CMSComponent` are written while thinking about the most common workflows that a user will go through while browsing the Phoenix app.
5. We make sure to run and debug the e2e tests locally in the browser provided by Cypress (via `cy.open`) as it helps us to know the reason of failure in a better way.
6. Both in the case of unit tests and the e2e tests, we avoid using timeouts as much as possible. We use `cy.wait` only when we are sure that the element will be rendered in the DOM after a certain time.

### End-to-End Test Syntax in Cypress Example

```
describe('CMSComponent', () => {
  it('should render the CMS component', () => {
    cy.visit('/cms');
    cy.get('[data-testid="cms-component"]').should('be.visible');
  });
});
```

### Cypress Configuration

The configuration file for e2e tests is [cypress.config.ts](https://github.com/HSF/phoenix/blob/main/packages/phoenix-ng/cypress.config.ts). More examples of e2e tests can be found inside the [phoenix-app/cypress](https://github.com/HSF/phoenix/tree/main/packages/phoenix-ng/projects/phoenix-app/cypress) folder and we recommend you to check out the [official Cypress documentation](https://docs.cypress.io/guides/overview/why-cypress) as it is quite fantastic and more than enough to get started with Cypress.

# Running the tests locally

Ideally you test locally before pushing a PR. You can do this with e.g:

```
yarn test:ci
```

(please note you will need to have `jest` installed locally for this to work)

# Fixing problems

If you see issues, either in the CI or from your local tests (see above), then follow these tips to help solve the problems.

## Failures in documentation coverage

We currently fail the CI if the documentation coverage drops below 100%. If this happens, the easiest way to find the undocumentation code is to run `compodoc` locally, _without_ the coverage requirement. i.e. do:

```
cd packages/phoenix-event-display
yarn compodoc -p configs/compodoc.conf.json
```

Now you can look in `documentation` and see which code is not fully documented.
Once you have fixed it, you can check the CI would succeed with:

```
# From the root directory
yarn docs:coverage
```

## Failures in linting

If you see errors like:

```
10:43  error  Insert `,`  prettier/prettier
```

Then firstly, you should be able to spot them locally by running:

```sh
yarn lint
```

and you can automatically fix them with:

```sh
yarn lint:fix
```

(obviously you will then need to commit and push the fixes).
