describe('User scenarios', () => {
  it('should generate a shareable link based on specified params: JiveXML', () => {
    cy.visit('/trackml');
    cy.get('app-share-link').click();

    cy.get('#eventDataFile').type('test_path', { force: true });
    cy.contains('test_path').should('be.visible');
    cy.get('#eventDataType').select('JiveXML');
    cy.get('#eventDataType').should('have.value', 'jivexml');
    cy.get('#configuration').type('test_path2', { force: true });
    cy.contains('test_path2').should('be.visible');

    cy.get('.share-box')
      .eq(0)
      .contains(
        Cypress.config().baseUrl +
          'trackml?file=test_path&type=jivexml&config=test_path2'
      )
      .should('be.visible');
    cy.get('.share-box')
      .eq(1)
      .contains(
        '<iframe src="' +
          Cypress.config().baseUrl +
          'trackml?embed=true&file=test_path&type=jivexml&config=test_path2"></iframe>'
      )
      .should('be.visible');

    cy.contains('Close').click();
  });

  it('should generate a shareable link based on specified params: JSON', () => {
    cy.visit('/trackml');
    cy.get('app-share-link').click();

    cy.get('#eventDataFile').type('test', { force: true });
    cy.contains('test').should('be.visible');
    cy.get('#eventDataType').select('JSON');
    cy.get('#eventDataType').should('have.value', 'json');
    cy.get('#configuration').type('test2', { force: true });
    cy.contains('test2').should('be.visible');

    cy.get('.share-box')
      .eq(0)
      .contains(
        Cypress.config().baseUrl + 'trackml?file=test&type=json&config=test2'
      )
      .should('be.visible');
    cy.get('.share-box')
      .eq(1)
      .contains(
        '<iframe src="' +
          Cypress.config().baseUrl +
          'trackml?embed=true&file=test&type=json&config=test2"></iframe>'
      )
      .should('be.visible');

    cy.contains('Close').click();
  });

  it('should be responsive', () => {
    cy.visit('/');
    cy.viewport(320, 480);
    cy.document().toMatchImageSnapshot();
  });
});
