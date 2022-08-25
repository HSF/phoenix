describe('ATLAS', () => {
  before(() => {
    cy.visit('/atlas');
  });

  it('should display the ATLAS detector properly', () => {
    cy.get('img[src="assets/images/logo-text.svg"]').should('be.visible');
    cy.get('.load-complete')
      .contains('(This may take a while)')
      .should('exist');

    cy.get('app-atlas').should('be.visible');
    cy.get('app-nav').should('be.visible');
    cy.get('app-loader').should('exist');
    cy.get('app-ui-menu').should('be.visible');
    cy.get('app-ui-menu-wrapper').should('be.visible');
    cy.get('app-embed-menu').should('exist');
    cy.get('app-dark-theme').should('be.visible');
    cy.get('app-auto-rotate').should('be.visible');
    cy.get('app-main-view-toggle').should('be.visible');
    cy.get('app-animate-event').should('be.visible');
    cy.get('app-animate-camera').should('be.visible');
    cy.get('app-experiment-link').should('exist');
    cy.get('app-experiment-info').should('be.visible');
    cy.get('app-phoenix-menu').should('be.visible');
    cy.get('app-phoenix-menu-item').should('be.visible');

    cy.get('#uiMenu').should('be.visible');
    cy.get('#optionsPanel').should('be.visible');
    cy.get('#embedMenu').should('exist');
    cy.get('#three-canvas').should('be.visible');
    cy.get('#eventDisplay').should('be.visible');
    cy.get('#statsElement').should('be.visible');
  });

  it('should display the correct text', () => {
    cy.get('app-experiment-info')
      .contains('ATLAS Experiment at CERN')
      .should('exist');
    cy.get('app-phoenix-menu-item').contains('Phoenix Menu').should('exist');
    cy.get('.experimentLogo[src="assets/images/atlas.svg"]').should(
      'be.visible'
    );
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
    cy.contains('Magnets').should('exist');
    cy.contains('Calorimeters').should('exist');
    cy.contains('Inner Detector').should('exist');
    cy.contains('Muon Spectrometer').should('exist');
    cy.get('.phoenix-menu-item-right > button').eq(1).click();

    cy.get('.phoenix-menu-item-right > button').eq(2).click();
    cy.contains('Tracks').should('exist');
    cy.contains('Jets').should('exist');
    cy.contains('Hits').should('exist');
    cy.contains('CaloClusters').should('exist');
    cy.contains('CaloCells').should('exist');
    cy.contains('PlanarCaloCells').should('exist');
    cy.contains('Muons').should('exist');
    cy.contains('Photons').should('exist');
    cy.contains('Electrons').should('exist');
    cy.contains('Vertices').should('exist');
    cy.contains('MissingEnergy').should('exist');
    cy.get('.phoenix-menu-item-right > button').eq(2).click();
  });
});
