describe('Playground', () => {
  it('should match the whole page', () => {
    cy.visit('/playground').then(() => {
      cy.contains('This may take a while').should('not.be.visible');
      cy.document().toMatchImageSnapshot();
    });
  });
});
