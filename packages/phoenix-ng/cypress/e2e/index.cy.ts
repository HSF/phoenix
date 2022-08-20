describe('Test the index page of Phoenix', () => {
  it('should be up and running', () => {
    cy.visit('https://hepsoftwarefoundation.org/phoenix/#/');
  });

  it('should display the correct title', () => {
    cy.title().should('eq', 'Phoenix');
  });

  it('should display all the image logos', () => {
    cy.get('img').should('be.visible').and('have.length', 7);
  });

  it('should display the correct text', () => {
    cy.get('.lead')
      .contains('Application for visualizing High Energy Physics data')
      .should('be.visible');
  });

  it('should display the card titles', () => {
    cy.get('.card-title').should('be.visible').and('have.length', 6);
  });

  it('should display the card text', () => {
    cy.get('.card-text').should('be.visible').and('have.length', 6);
  });

  it('should display the correct footer text', () => {
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

  describe('Test the card body', () => {
    it('should display the Playground card properly', () => {
      cy.get('.card-body').eq(0).should('be.visible');
      cy.get('.card-title').eq(0).contains('Playground');
      cy.get('.card-text')
        .eq(0)
        .contains('Get started with the different Phoenix features');
      cy.get('.btn-primary').eq(0).contains('Show');
    });

    it('should display the Geometry display card properly', () => {
      cy.get('.card-body').eq(1).should('be.visible');
      cy.get('.card-title').eq(1).contains('Geometry display');
      cy.get('.card-text')
        .eq(1)
        .contains('This test should show some simple geometry');
      cy.get('.btn-primary').eq(1).contains('Show');
    });

    it('should display the ATLAS card properly', () => {
      cy.get('.card-body').eq(2).should('be.visible');
      cy.get('.card-title').eq(2).contains('ATLAS');
      cy.get('.card-text')
        .eq(2)
        .contains('Show the ATLAS detector. One simple event');
      cy.get('.btn-primary').eq(2).contains('Show');
    });

    it('should display the LHCb card properly', () => {
      cy.get('.card-body').eq(3).should('be.visible');
      cy.get('.card-title').eq(3).contains('LHCb');
      cy.get('.card-text')
        .eq(3)
        .contains('Show the LHCb detector. One simple event');
      cy.get('.btn-primary').eq(3).contains('Show');
    });

    it('should display the CMS card properly', () => {
      cy.get('.card-body').eq(4).should('be.visible');
      cy.get('.card-title').eq(4).contains('CMS');
      cy.get('.card-text')
        .eq(4)
        .contains('Show the CMS detector. One simple event');
      cy.get('.btn-primary').eq(4).contains('Show');
    });

    it('should display the TrackML card properly', () => {
      cy.get('.card-body').eq(5).should('be.visible');
      cy.get('.card-title').eq(5).contains('TrackML');
      cy.get('.card-text')
        .eq(5)
        .contains(
          'Visualisation for TrackML. Shows how to write a custom event loader'
        );
      cy.get('.btn-primary').eq(5).contains('Show');
    });

    it('should navigate to the correct page', () => {
      cy.get('.btn-primary').eq(0).click();
      cy.url().should(
        'eq',
        'https://hepsoftwarefoundation.org/phoenix/#/playground'
      );
      cy.go('back');
      cy.get('.btn-primary').eq(1).click();
      cy.url().should(
        'eq',
        'https://hepsoftwarefoundation.org/phoenix/#/geometry'
      );
      cy.go('back');
      cy.get('.btn-primary').eq(2).click();
      cy.url().should(
        'eq',
        'https://hepsoftwarefoundation.org/phoenix/#/atlas'
      );
      cy.go('back');
      cy.get('.btn-primary').eq(3).click();
      cy.url().should('eq', 'https://hepsoftwarefoundation.org/phoenix/#/lhcb');
      cy.go('back');
      cy.get('.btn-primary').eq(4).click();
      cy.url().should('eq', 'https://hepsoftwarefoundation.org/phoenix/#/cms');
      cy.go('back');
      cy.get('.btn-primary').eq(5).click();
      cy.url().should(
        'eq',
        'https://hepsoftwarefoundation.org/phoenix/#/trackml'
      );
      cy.go('back');
    });
  });
});
