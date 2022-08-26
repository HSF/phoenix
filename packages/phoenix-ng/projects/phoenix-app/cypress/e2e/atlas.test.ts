/* eslint-disable @typescript-eslint/ban-ts-comment */
describe('ATLAS', () => {
  before(() => {
    cy.visit('/atlas').then(() => {
      cy.log('visited /atlas');
    });
  });

  it('Visual test case for ATLAS document', () => {
    cy.wait(10000);
    // @ts-ignore
    cy.document().toMatchImageSnapshot();
  });
});
