/* eslint-disable @typescript-eslint/ban-ts-comment */
describe('Playground', () => {
  before(() => {
    cy.visit('/playground').then(() => {
      cy.log('visited /playground');
    });
  });

  it('Visual test case for Playground document', () => {
    cy.wait(2000);
    // @ts-ignore
    cy.document().toMatchImageSnapshot();
  });
});
