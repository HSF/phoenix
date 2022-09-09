describe('Test the index page of Phoenix', () => {
  it('should match the whole page', () => {
    cy.visit('/').then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });

  it('should navigate to the correct page', () => {
    // there will only be one link within the card
    cy.get('.card a').eq(0).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'playground');
    cy.go('back');
    cy.get('.card a').eq(1).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'geometry');
    cy.go('back');
    cy.get('.card a').eq(2).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'atlas');
    cy.go('back');
    cy.get('.card a').eq(3).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'lhcb');
    cy.go('back');
    cy.get('.card a').eq(4).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'cms');
    cy.go('back');
    cy.get('.card a').eq(5).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'trackml');
    cy.go('back');
  });
});
