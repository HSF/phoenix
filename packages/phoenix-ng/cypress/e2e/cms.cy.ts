describe('CMS', () => {
  it('should be up and running', () => {
    cy.visit('/cms');
  });

  it('should display the CMS detector properly', () => {
    cy.get('img[src="assets/images/logo-text.svg"]').should('be.visible');
    cy.get('.load-complete')
      .contains('(This may take a while)')
      .should('exist');

    cy.get('app-cms').should('be.visible');
    cy.get('app-loader').should('exist');
    cy.get('app-nav').should('be.visible');
    cy.get('app-ui-menu').should('be.visible');
    cy.get('app-ui-menu-wrapper').should('be.visible');
    cy.get('app-embed-menu').should('exist');
    cy.get('app-dark-theme').should('be.visible');
    cy.get('app-auto-rotate').should('be.visible');
    cy.get('app-main-view-toggle').should('be.visible');
    cy.get('app-animate-event').should('be.visible');
    cy.get('app-experiment-link').should('exist');
    cy.get('app-experiment-info').should('be.visible');
    cy.get('app-phoenix-menu').should('be.visible');
    cy.get('app-phoenix-menu-item').should('be.visible');

    cy.get('#embedMenu').should('exist');
    cy.get('#uiMenu').should('be.visible');
    cy.get('#optionsPanel').should('be.visible');
    cy.get('#three-canvas').should('be.visible');
    cy.get('#eventDisplay').should('be.visible');
    cy.get('#statsElement').should('be.visible');
  });

  it('should display the correct text', () => {
    cy.get('app-experiment-info')
      .contains('CMS Experiment at LHC, CERN')
      .should('exist');
    cy.get('app-phoenix-menu-item').contains('Phoenix Menu').should('exist');
    cy.get('.experimentLogo[src="assets/images/cms.svg"]').should('be.visible');
  });

  it('should display the Phoenix menu properly', () => {
    cy.get('.phoenix-menu-item-right .item-settings').click();
    cy.contains('Save state').should('exist');
    cy.contains('Load state').should('exist');
    cy.get('.phoenix-menu-item-right .item-config-backdrop').click();

    cy.get('.phoenix-menu-item-right .item-expand').click();
    cy.contains('Detector').should('exist');
    cy.contains('Event Data').should('exist');
    cy.contains('Labels').should('exist');

    cy.get('.phoenix-menu-item-right > button').eq(1).click();
    cy.contains('Tracks').should('exist');
    cy.contains('Jets').should('exist');
    cy.contains('CaloClusters').should('exist');
    cy.contains('MuonChambers').should('exist');
    cy.get('.phoenix-menu-item-right > button').eq(1).click();

    cy.get('.phoenix-menu-item-right > button').eq(2).click();
    cy.contains('CMS Detector').should('exist');
    cy.get('.phoenix-menu-item-right > button').eq(2).click();
  });
});
