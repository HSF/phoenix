describe('Playground', () => {
  it('should be able to load the Playground', () => {
    cy.visit('/playground');
  });

  it('should display the Phoenix logo', () => {
    cy.get('img[src="assets/images/logo-text.svg"]').should('be.visible');
  });

  it('should load the Phoenix iconbar', () => {
    cy.get('#optionsPanel').should('be.visible');
    cy.get('app-zoom-controls').should('be.visible');
    cy.get('app-view-options').should('be.visible');
    cy.get('app-auto-rotate').should('be.visible');
    cy.get('app-dark-theme').should('be.visible');
    cy.get('app-object-clipping').should('be.visible');
    cy.get('app-main-view-toggle').should('be.visible');
    cy.get('app-overlay-view').should('be.visible');
    cy.get('app-object-selection').should('be.visible');
    cy.get('app-info-panel').should('be.visible');
    cy.get('app-animate-event').should('be.visible');
    cy.get('app-animate-camera').should('be.visible');
    cy.get('app-collections-info').should('be.visible');
    cy.get('app-performance-toggle').should('be.visible');
    cy.get('app-vr-toggle').should('be.visible');
    cy.get('app-ar-toggle').should('be.visible');
    cy.get('app-ss-mode').should('be.visible');
    cy.get('app-io-options').should('be.visible');
    cy.get('app-share-link').should('be.visible');
  });

  it('should hide the iconbar', () => {
    cy.get('#hideUIMenu').click();
    cy.get('#optionsPanel').should('not.be.visible');
    cy.get('#hideUIMenu').click();
    cy.get('#optionsPanel').should('be.visible');
  });
});
