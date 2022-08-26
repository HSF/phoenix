describe('CMS', () => {
  before(() => {
    cy.visit('/cms').then(() => {
      cy.log('visited /cms');
    });
  });

  it('Visual test case for CMS document', () => {
    cy.document().toMatchImageSnapshot();
  });

  describe('Phoenix Menu', () => {
    it('Visual Test for Phoenix Menu - save & load state', () => {
      cy.get('.phoenix-menu-item-right .item-settings').click();
      cy.document().toMatchImageSnapshot();
      cy.get('.phoenix-menu-item-right .item-config-backdrop').click();
    });

    it('Visual Test for Phoenix Menu - dropdown', () => {
      cy.get('.phoenix-menu-item-right > button').eq(0).click();
      cy.document().toMatchImageSnapshot();
    });

    it('Visual Test for Phoenix Menu - event data dropdown', () => {
      cy.get('.phoenix-menu-item-right > button').eq(1).click();
      cy.document().toMatchImageSnapshot();
      cy.get('.phoenix-menu-item-right > button').eq(1).click();
    });

    it('Visual Test for Phoenix Menu - detector dropdown', () => {
      cy.get('.phoenix-menu-item-right > button').eq(2).click();
      cy.document().toMatchImageSnapshot();
      cy.get('.phoenix-menu-item-right > button').eq(2).click();
    });

    it('Visual Test for Phoenix Menu - hide event data', () => {
      cy.get('app-phoenix-menu-item').eq(1).click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-phoenix-menu-item').eq(1).click();
    });

    it('Visual Test for Phoenix Menu - hide labels', () => {
      cy.get('app-phoenix-menu-item').eq(2).click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-phoenix-menu-item').eq(2).click();
    });

    it('Visual Test for Phoenix Menu - hide detector geometry', () => {
      cy.get('app-phoenix-menu-item').eq(3).click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-phoenix-menu-item').eq(3).click();
    });

    it('Visual Test for Phoenix Menu - close the menu', () => {
      cy.get('.phoenix-menu-item-right .icon-wrapper').eq(1).click();
      cy.document().toMatchImageSnapshot();
    });
  });

  describe('Phoenix Iconbar', () => {
    it('Visual Test for Phoenix Iconbar - View Options', () => {
      cy.get('app-view-options').click();
      cy.document().toMatchImageSnapshot();
      cy.get('.cdk-overlay-backdrop').click();
    });

    it('Visual Test for Phoenix Iconbar - Dark Theme', () => {
      cy.get('app-dark-theme').eq(0).click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-dark-theme').eq(0).click();
    });

    it('Visual Test for Phoenix Iconbar - Object Clipping', () => {
      cy.get('app-object-clipping').click();
      cy.document().toMatchImageSnapshot();
      cy.get('.cdk-overlay-backdrop').click();
    });

    it('Visual Test for Phoenix Iconbar - Orthographic View', () => {
      cy.get('app-main-view-toggle').eq(0).click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-main-view-toggle').eq(0).click();
    });

    it('Visual Test for Phoenix Iconbar - Overlay View', () => {
      cy.get('app-overlay-view').click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-overlay-view').click();
    });

    it('Visual Test for Phoenix Iconbar - Object Selection', () => {
      cy.get('app-object-selection').click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-object-selection').click();
    });

    it('Visual Test for Phoenix Iconbar - Info Panel', () => {
      cy.get('app-info-panel').click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-info-panel').click();
    });

    it('Visual Test for Phoenix Iconbar - Animate Event', () => {
      cy.get('app-animate-event').eq(0).click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-animate-event').eq(0).click();
    });

    it('Visual Test for Phoenix Iconbar - Preset Animations', () => {
      cy.get('app-animate-camera > app-menu-toggle').eq(0).click();
      cy.document().toMatchImageSnapshot();
      cy.get('.cdk-overlay-backdrop').click();
    });

    it('Visual Test for Phoenix Iconbar - Collections Info', () => {
      cy.get('app-collections-info').click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-collections-info').click();
    });

    it('Visual Test for Phoenix Iconbar - Performance Mode', () => {
      cy.get('app-performance-toggle').click();
      cy.document().toMatchImageSnapshot();
      cy.get('app-performance-toggle').click();
    });

    it('Visual Test for Phoenix Iconbar - IO Options', () => {
      cy.get('app-io-options').click();
      cy.document().toMatchImageSnapshot();
      cy.contains('Close').click();
    });

    it('Visual Test for Phoenix Iconbar - Share Link', () => {
      cy.get('app-share-link').click();
      cy.document().toMatchImageSnapshot();
      cy.contains('Close').click();
    });
  });
});
