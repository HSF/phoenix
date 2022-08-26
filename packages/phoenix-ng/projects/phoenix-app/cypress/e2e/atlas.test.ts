describe('ATLAS', () => {
  before(() => {
    cy.visit('/atlas').then(() => {
      cy.log('visited /atlas');
    });
  });

  it('Visual test case for ATLAS document', () => {
    cy.document().toMatchImageSnapshot();
  });
});
