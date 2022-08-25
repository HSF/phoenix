/* eslint-disable @typescript-eslint/ban-ts-comment */
describe('LHCb', () => {
  before(() => {
    cy.visit('/lhcb').then(() => {
      cy.log('visited /lhcb');
    });
  });

  it('Visual test case for LHCb document', () => {
    cy.wait(6000);
    // @ts-ignore
    cy.document().toMatchImageSnapshot();
  });
});
