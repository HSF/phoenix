'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link"><img data-src="images/logo-text.svg" class='img-responsive' data-type="compodoc-logo"></a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' : 'data-target="#xs-components-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' :
                                            'id="xs-components-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AtlasComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AtlasComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AutoRotateComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AutoRotateComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CollectionsInfoComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">CollectionsInfoComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CollectionsInfoOverlayComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">CollectionsInfoOverlayComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DarkThemeComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DarkThemeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EventSelectorComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EventSelectorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ExperimentInfoComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ExperimentInfoComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GeometryComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">GeometryComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HomeComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">HomeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IOOptionsDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">IOOptionsDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IoOptionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">IoOptionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LHCbComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">LHCbComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuToggleComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MenuToggleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">NavComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ObjectClippingComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ObjectClippingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ObjectSelectionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ObjectSelectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ObjectSelectionOverlayComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ObjectSelectionOverlayComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OverlayViewComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">OverlayViewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OverlayViewWindowComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">OverlayViewWindowComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlaygroundComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PlaygroundComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlaygroundVrComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PlaygroundVrComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TrackmlComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TrackmlComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UiMenuComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UiMenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewOptionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ViewOptionsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' : 'data-target="#xs-pipes-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' :
                                            'id="xs-pipes-links-module-AppModule-a93c992cf93801ba674f951f42bdcb54"' }>
                                            <li class="link">
                                                <a href="pipes/AttributePipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttributePipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/Configuration.html" data-type="entity-link">Configuration</a>
                            </li>
                            <li class="link">
                                <a href="classes/ControlsManager.html" data-type="entity-link">ControlsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Cut.html" data-type="entity-link">Cut</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExportManager.html" data-type="entity-link">ExportManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportManager.html" data-type="entity-link">ImportManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/JiveXMLLoader.html" data-type="entity-link">JiveXMLLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/LHCbLoader.html" data-type="entity-link">LHCbLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/PhoenixLoader.html" data-type="entity-link">PhoenixLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/PhoenixObjects.html" data-type="entity-link">PhoenixObjects</a>
                            </li>
                            <li class="link">
                                <a href="classes/PresetView.html" data-type="entity-link">PresetView</a>
                            </li>
                            <li class="link">
                                <a href="classes/RendererManager.html" data-type="entity-link">RendererManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/SceneManager.html" data-type="entity-link">SceneManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/SelectionManager.html" data-type="entity-link">SelectionManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/TrackmlLoader.html" data-type="entity-link">TrackmlLoader</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/EventdisplayService.html" data-type="entity-link">EventdisplayService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ThreeService.html" data-type="entity-link">ThreeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UIService.html" data-type="entity-link">UIService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/EventDataLoader.html" data-type="entity-link">EventDataLoader</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Window.html" data-type="entity-link">Window</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});