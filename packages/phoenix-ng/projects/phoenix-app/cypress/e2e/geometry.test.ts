describe('Geometry', () => {
  it('should match the whole page', () => {
    cy.visit('/geometry').then(() => {
      cy.contains('This may take a while').should('not.be.visible');
      cy.document().toMatchImageSnapshot();
    });
  });
});
