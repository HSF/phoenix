/* eslint-disable @typescript-eslint/ban-ts-comment */
describe('Test the index page of Phoenix', () => {
  before(() => {
    cy.visit('/').then(() => {
      cy.log('visited /');
    });
  });

  it('Visual test case for index document', () => {
    cy.wait(3000);
    // @ts-ignore
    cy.document().toMatchImageSnapshot();
  });

  it('should navigate to the correct page', () => {
    cy.get('.btn-primary').eq(0).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'playground');
    cy.go('back');
    cy.get('.btn-primary').eq(1).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'geometry');
    cy.go('back');
    cy.get('.btn-primary').eq(2).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'atlas');
    cy.go('back');
    cy.get('.btn-primary').eq(3).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'lhcb');
    cy.go('back');
    cy.get('.btn-primary').eq(4).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'cms');
    cy.go('back');
    cy.get('.btn-primary').eq(5).click();
    cy.url().should('eq', Cypress.config().baseUrl + 'trackml');
    cy.go('back');
  });

  it('should point to correct links in footer', () => {
    cy.get('footer > p').contains('2022 Phoenix Project').should('be.visible');
    cy.get('footer > p ')
      .eq(1)
      .contains('Github - Documentation')
      .should('be.visible');
    cy.get('footer > p > a')
      .eq(0)
      .should('have.attr', 'href', 'https://github.com/HSF/phoenix');
    cy.get('footer > p > a')
      .eq(1)
      .should(
        'have.attr',
        'href',
        'https://github.com/HSF/phoenix/blob/master/README.md'
      );
  });
});
