describe('Geometry', () => {
  before(() => {
    cy.visit('/geometry').then(() => {
      cy.log('visited /geometry');
    });
  });

  it('Visual test case for geometry document', () => {
    cy.document().toMatchImageSnapshot();
  });
});
