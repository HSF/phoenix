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
                    <a href="index.html" data-type="index-link">
                        <img alt="" class="img-responsive" data-type="custom-logo" data-src="images/logo-text.svg">
                    </a>
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
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
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
                                <a href="classes/ActiveVariable.html" data-type="entity-link" >ActiveVariable</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnimationsManager.html" data-type="entity-link" >AnimationsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ARManager.html" data-type="entity-link" >ARManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/CMSLoader.html" data-type="entity-link" >CMSLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/CMSObjects.html" data-type="entity-link" >CMSObjects</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColorManager.html" data-type="entity-link" >ColorManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColorOptions.html" data-type="entity-link" >ColorOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/ControlsManager.html" data-type="entity-link" >ControlsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/CoordinateHelper.html" data-type="entity-link" >CoordinateHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/Cut.html" data-type="entity-link" >Cut</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatGUIMenuUI.html" data-type="entity-link" >DatGUIMenuUI</a>
                            </li>
                            <li class="link">
                                <a href="classes/EffectsManager.html" data-type="entity-link" >EffectsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/EventDisplay.html" data-type="entity-link" >EventDisplay</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExportManager.html" data-type="entity-link" >ExportManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Field.html" data-type="entity-link" >Field</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportManager.html" data-type="entity-link" >ImportManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/InfoLogger.html" data-type="entity-link" >InfoLogger</a>
                            </li>
                            <li class="link">
                                <a href="classes/JiveXMLLoader.html" data-type="entity-link" >JiveXMLLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/JSRootEventLoader.html" data-type="entity-link" >JSRootEventLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoadingManager.html" data-type="entity-link" >LoadingManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/PhoenixLoader.html" data-type="entity-link" >PhoenixLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/PhoenixMenuNode.html" data-type="entity-link" >PhoenixMenuNode</a>
                            </li>
                            <li class="link">
                                <a href="classes/PhoenixMenuUI.html" data-type="entity-link" >PhoenixMenuUI</a>
                            </li>
                            <li class="link">
                                <a href="classes/PhoenixObjects.html" data-type="entity-link" >PhoenixObjects</a>
                            </li>
                            <li class="link">
                                <a href="classes/PresetView.html" data-type="entity-link" >PresetView</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrettySymbols.html" data-type="entity-link" >PrettySymbols</a>
                            </li>
                            <li class="link">
                                <a href="classes/RendererManager.html" data-type="entity-link" >RendererManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RKHelper.html" data-type="entity-link" >RKHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/RungeKutta.html" data-type="entity-link" >RungeKutta</a>
                            </li>
                            <li class="link">
                                <a href="classes/SceneManager.html" data-type="entity-link" >SceneManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScriptLoader.html" data-type="entity-link" >ScriptLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/SelectionManager.html" data-type="entity-link" >SelectionManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/State.html" data-type="entity-link" >State</a>
                            </li>
                            <li class="link">
                                <a href="classes/StateManager.html" data-type="entity-link" >StateManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ThreeManager.html" data-type="entity-link" >ThreeManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/TrackmlLoader.html" data-type="entity-link" >TrackmlLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/UIManager.html" data-type="entity-link" >UIManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/URLOptionsManager.html" data-type="entity-link" >URLOptionsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/VRManager.html" data-type="entity-link" >VRManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/XRManager.html" data-type="entity-link" >XRManager</a>
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
                                <a href="interfaces/AnimationPreset.html" data-type="entity-link" >AnimationPreset</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Configuration.html" data-type="entity-link" >Configuration</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EventDataLoader.html" data-type="entity-link" >EventDataLoader</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PhoenixUI.html" data-type="entity-link" >PhoenixUI</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Window.html" data-type="entity-link" >Window</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
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