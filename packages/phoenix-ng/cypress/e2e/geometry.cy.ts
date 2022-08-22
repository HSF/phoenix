describe('Geometry', () => {
  it('should load a simple geometry', () => {
    cy.visit('/geometry');
    cy.get('.load-complete')
      .contains('(This may take a while)')
      .should('exist');
    cy.get('app-nav').should('be.visible');
    cy.get('.demo-info').contains('Geometry Demo').should('exist');
    cy.get('.demo-info')
      .contains('Try opening the console and typing:')
      .should('exist');
    cy.get('.copy-code').contains('Copy').should('exist');
    cy.get('#three-canvas').should('be.visible');
    cy.get('#statsElement').should('be.visible');
  });
});
