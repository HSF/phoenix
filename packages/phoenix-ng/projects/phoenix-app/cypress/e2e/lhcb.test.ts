describe('LHCb', () => {
  before(() => {
    cy.visit('/lhcb').then(() => {
      cy.log('visited /lhcb');
    });
  });

  it('Visual test case for LHCb document', () => {
    cy.document().toMatchImageSnapshot();
  });
});
