describe('TrackML', () => {
  it('should match the whole page', () => {
    cy.visit('/trackml').then(() => {
      cy.contains('This may take a while').should('not.be.visible');
      cy.document().toMatchImageSnapshot();
    });
  });
});
