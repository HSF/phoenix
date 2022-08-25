/* eslint-disable @typescript-eslint/ban-ts-comment */
describe('Geometry', () => {
  before(() => {
    cy.visit('/geometry').then(() => {
      cy.log('visited /geometry');
    });
  });

  it('Visual test case for geometry document', () => {
    cy.wait(3000);
    // @ts-ignore
    cy.document().toMatchImageSnapshot();
  });
});
