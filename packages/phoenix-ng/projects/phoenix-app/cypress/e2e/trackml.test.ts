describe('TrackML', () => {
  before(() => {
    cy.visit('/trackml').then(() => {
      cy.log('visited /trackml');
    });
  });

  it('Visual test case for TrackML document', () => {
    cy.document().toMatchImageSnapshot();
  });
});
