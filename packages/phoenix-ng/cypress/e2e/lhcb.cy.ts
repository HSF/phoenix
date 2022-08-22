describe('ATLAS', () => {
  it('should be up and running', () => {
    cy.visit('/lhcb');
  });

  it('should display the LHCb detector properly', () => {
    cy.get('img[src="assets/images/logo-text.svg"]').should('be.visible');
    cy.get('.load-complete')
      .contains('(This may take a while)')
      .should('exist');
    cy.get('app-lhcb').should('be.visible');
    cy.get('app-nav').should('be.visible');
    cy.get('app-loader').should('exist');
    cy.get('app-ui-menu-wrapper').should('be.visible');
    cy.get('#uiMenu').should('be.visible');
    cy.get('#optionsPanel').should('be.visible');
    cy.get('app-embed-menu').should('exist');
    cy.get('#embedMenu').should('exist');
    cy.get('app-dark-theme').should('be.visible');
    cy.get('app-auto-rotate').should('be.visible');
    cy.get('app-main-view-toggle').should('be.visible');
    cy.get('app-animate-event').should('be.visible');
    cy.get('app-experiment-link').should('exist');
    cy.get('app-experiment-info').should('be.visible');
    cy.get('app-phoenix-menu').should('be.visible');
    cy.get('app-phoenix-menu-item').should('be.visible');
    cy.get('#three-canvas').should('be.visible');
    cy.get('#eventDisplay').should('be.visible');
    cy.get('#statsElement').should('be.visible');
  });

  it('should display the correct text', () => {
    cy.get('app-experiment-info')
      .contains('LHCb Experiment at CERN')
      .should('exist');
    cy.get('app-phoenix-menu-item').contains('Phoenix Menu').should('exist');
    cy.get('.experimentLogo[src="assets/images/lhcb.svg"]').should(
      'be.visible'
    );
  });

  it('should render the Phoenix menu properly', () => {
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
    cy.contains('Hits').should('exist');
    cy.contains('PlanarCaloCells').should('exist');
    cy.contains('Vertices').should('exist');
    cy.get('.phoenix-menu-item-right > button').eq(1).click();

    cy.get('.phoenix-menu-item-right > button').eq(2).click();
    cy.contains('BeamPipe').should('exist');
    cy.contains('VP').should('exist');
    cy.contains('UT').should('exist');
    cy.contains('Rich1').should('exist');
    cy.contains('Magnet').should('exist');
    cy.contains('FT').should('exist');
    cy.contains('Rich2').should('exist');
    cy.contains('NeutronShielding').should('exist');
    cy.contains('Ecal').should('exist');
    cy.contains('Hcal').should('exist');
    cy.contains('Muon').should('exist');
    cy.get('.phoenix-menu-item-right > button').eq(2).click();
  });
});
