/* eslint-disable @typescript-eslint/ban-ts-comment */
describe('TrackML', () => {
  before(() => {
    cy.visit('/trackml').then(() => {
      cy.log('visited /trackml');
    });
  });

  it('Visual test case for TrackML document', () => {
    cy.wait(5000);
    // @ts-ignore
    cy.document().toMatchImageSnapshot();
  });
});
