/// <reference types="../support/index.d.ts" />

describe('Home Page', () => {
    it('should render home sections', () => {
        // visitar a página
        cy.visit('/')
     
        // seleciona os banners
        cy.shouldRenderBanner()
    })
})