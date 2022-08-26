describe('Playground', () => {
  before(() => {
    cy.visit('/playground').then(() => {
      cy.log('visited /playground');
    });
  });

  it('Visual test case for Playground document', () => {
    cy.document().toMatchImageSnapshot();
  });
});
