describe('CMS', () => {
  it('should match the whole page', () => {
    cy.visit('/cms').then(() => {
      cy.contains('This may take a while').should('not.be.visible');
      // in order to make the detector appear which loads in 2 - 2.5 seconds
      cy.wait(2500);
      cy.document().toMatchImageSnapshot();
    });
  });

  describe('Phoenix Menu', () => {
    it('should have options to Save and Load state', () => {
      cy.get('.phoenix-menu-item-right .item-settings').click();

      cy.contains('Save state').should('exist');
      cy.contains('Load state').should('exist');

      cy.get('.phoenix-menu-item-right .item-config-backdrop').click();
    });

    it('should display correct options under event data dropdown', () => {
      cy.get('.phoenix-menu-item-right > button').eq(0).click();
      cy.get('.phoenix-menu-item-right > button').eq(1).click();

      cy.contains('Tracks').should('exist');
      cy.contains('Jets').should('exist');
      cy.contains('CaloClusters').should('exist');
      cy.contains('MuonChambers').should('exist');

      cy.get('.phoenix-menu-item-right > button').eq(1).click();
    });

    it('should hide event data', () => {
      cy.get('app-phoenix-menu-item .mat-slide-toggle').eq(0).click();

      cy.document().toMatchImageSnapshot();

      cy.get('app-phoenix-menu-item').eq(1).click();
    });

    it('should hide detector geometry', () => {
      cy.get('app-phoenix-menu-item .mat-slide-toggle').eq(2).click();

      cy.document().toMatchImageSnapshot();

      cy.get('app-phoenix-menu-item').eq(3).click();
      cy.get('.phoenix-menu-item-right > button').eq(0).click();
    });
  });

  describe('Phoenix Iconbar', () => {
    it('should switch to use dark theme', () => {
      cy.get('app-dark-theme').eq(0).click();

      cy.document().toMatchImageSnapshot();

      cy.get('app-dark-theme').eq(0).click();
    });

    it('should zoom out', () => {
      cy.get('app-zoom-controls app-menu-toggle > button').eq(0).focus();
      for (let n = 0; n < 20; ++n) {
        cy.focused().click();
      }
      cy.document().toMatchImageSnapshot();
    });

    it('should do object clipping properly', () => {
      cy.get('app-object-clipping').click();
      cy.contains('Clipping').click();

      cy.contains('Start Angle')
        .focus()
        .type('{rightarrow}{rightarrow}{rightarrow}');
      cy.contains('Opening Angle')
        .focus()
        .type('{rightarrow}{rightarrow}{rightarrow}');

      cy.document().toMatchImageSnapshot();

      cy.contains('Clipping').click();
      cy.get('.cdk-overlay-backdrop').click();
    });

    it('should zoom in', () => {
      cy.get('app-zoom-controls app-menu-toggle > button').eq(1).focus();
      for (let n = 0; n < 20; ++n) {
        cy.focused().click();
      }
      cy.document().toMatchImageSnapshot();
    });

    it('should switch to orthographic view', () => {
      cy.get('app-main-view-toggle').eq(0).click();

      cy.document().toMatchImageSnapshot();

      cy.get('app-main-view-toggle').eq(0).click();
    });

    it('should switch to overlay view', () => {
      cy.get('app-overlay-view').click();

      cy.document().toMatchImageSnapshot();

      cy.get('app-overlay-view').click();
    });

    it('should switch to object selection mode', () => {
      cy.get('app-object-selection').click();

      cy.document().toMatchImageSnapshot();

      cy.get('app-object-selection').click();
    });

    it('should open the info panel', () => {
      cy.get('app-info-panel').click();

      cy.contains('Loaded JSON geometry: CMS Detector').should('be.visible');
      cy.contains('Loaded: Event#1605749984 from run#200091').should(
        'be.visible'
      );

      cy.get('app-info-panel').click();
    });

    it('should open the collections info panel', () => {
      cy.get('app-collections-info').click();

      cy.contains('Choose Collection').should('exist');

      cy.get('app-collections-info').click();
    });

    it('should show the Import and export options', () => {
      cy.get('app-io-options').click();

      cy.document().toMatchImageSnapshot();

      cy.contains('Close').click();
    });

    it('should use the view options', () => {
      cy.get('app-view-options').click();

      cy.contains('Show Grid').click();
      cy.document().toMatchImageSnapshot();
      cy.contains('Show Grid').click();
      cy.get('.cdk-overlay-backdrop').click();

      cy.get('app-view-options').click();
      cy.contains('Show Axis').click();
      cy.document().toMatchImageSnapshot();
      cy.contains('Show Axis').click();
      cy.get('.cdk-overlay-backdrop').click();

      cy.get('app-view-options').click();
      cy.contains('Left View').click();
      cy.wait(1500);
      cy.document().toMatchImageSnapshot();
      cy.get('.cdk-overlay-backdrop').click();

      cy.get('app-view-options').click();
      cy.contains('Center View').click();
      cy.wait(1500);
      cy.document().toMatchImageSnapshot();
      cy.get('.cdk-overlay-backdrop').click();
    });
  });
});
