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
                    <a href="index.html" data-type="index-link">root documentation</a>
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
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
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
                            <a href="todo.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>TODO
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
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-9110ceacb2772acce4b1cd1630889e0f02923e06dda7f4df74dee601c4a642290d0aa785cd77f6f2f0437415f5b7794191535814af5ce7c6a8ed949ddc8997ff"' : 'data-bs-target="#xs-components-links-module-AppModule-9110ceacb2772acce4b1cd1630889e0f02923e06dda7f4df74dee601c4a642290d0aa785cd77f6f2f0437415f5b7794191535814af5ce7c6a8ed949ddc8997ff"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-9110ceacb2772acce4b1cd1630889e0f02923e06dda7f4df74dee601c4a642290d0aa785cd77f6f2f0437415f5b7794191535814af5ce7c6a8ed949ddc8997ff"' :
                                            'id="xs-components-links-module-AppModule-9110ceacb2772acce4b1cd1630889e0f02923e06dda7f4df74dee601c4a642290d0aa785cd77f6f2f0437415f5b7794191535814af5ce7c6a8ed949ddc8997ff"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AtlasComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AtlasComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CMSComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CMSComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GeometryComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GeometryComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HomeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LHCbComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LHCbComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlaygroundComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaygroundComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TrackmlComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TrackmlComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/VPToggleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VPToggleComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/PhoenixUIModule.html" data-type="entity-link" >PhoenixUIModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' : 'data-bs-target="#xs-components-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' :
                                            'id="xs-components-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' }>
                                            <li class="link">
                                                <a href="components/AnimateCameraComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnimateCameraComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AnimateEventComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnimateEventComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ArToggleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ArToggleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AutoRotateComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AutoRotateComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CartesianGridConfigComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CartesianGridConfigComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CollectionsInfoComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollectionsInfoComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CollectionsInfoOverlayComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollectionsInfoOverlayComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ConfigSliderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConfigSliderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CycleEventsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CycleEventsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DarkThemeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DarkThemeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EmbedMenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmbedMenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EventDataExplorerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EventDataExplorerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EventDataExplorerDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EventDataExplorerDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EventSelectorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EventSelectorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ExperimentInfoComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExperimentInfoComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ExperimentLinkComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExperimentLinkComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FileExplorerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileExplorerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GeometryBrowserComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GeometryBrowserComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GeometryBrowserOverlayComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GeometryBrowserOverlayComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IOOptionsDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IOOptionsDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InfoPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InfoPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InfoPanelOverlayComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InfoPanelOverlayComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IoOptionsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IoOptionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoaderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoaderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MainViewToggleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MainViewToggleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MakePictureComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MakePictureComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuToggleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuToggleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ObjectClippingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ObjectClippingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ObjectSelectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ObjectSelectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ObjectSelectionOverlayComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ObjectSelectionOverlayComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OverlayComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OverlayComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OverlayViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OverlayViewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OverlayViewWindowComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OverlayViewWindowComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PerformanceToggleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PerformanceToggleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PhoenixMenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PhoenixMenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PhoenixMenuItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PhoenixMenuItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RingLoaderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RingLoaderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SSModeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SSModeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ShareLinkComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShareLinkComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ShareLinkDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShareLinkDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TreeMenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TreeMenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TreeMenuItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TreeMenuItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UiMenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UiMenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UiMenuWrapperComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UiMenuWrapperComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewOptionsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewOptionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/VrToggleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VrToggleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ZoomControlsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZoomControlsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' : 'data-bs-target="#xs-injectables-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' :
                                        'id="xs-injectables-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' }>
                                        <li class="link">
                                            <a href="injectables/ErrorMessageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ErrorMessageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/EventDisplayService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EventDisplayService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GlobalErrorHandler.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GlobalErrorHandler</a>
                                        </li>
                                    </ul>
                                </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#pipes-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' : 'data-bs-target="#xs-pipes-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' :
                                            'id="xs-pipes-links-module-PhoenixUIModule-08f9fb499f2d6826f33dff416e5a7e366c37ce3409c53c56b5a1328626b6357c72a56eae7d59e9b157390be40a4c8721f56f712291e31c4f553e90d09c6f7aee"' }>
                                            <li class="link">
                                                <a href="pipes/AttributePipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AttributePipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TestModule.html" data-type="entity-link" >TestModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TestModule.html" data-type="entity-link" >TestModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/FileEvent.html" data-type="entity-link" >FileEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileNode.html" data-type="entity-link" >FileNode</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportOption.html" data-type="entity-link" >ImportOption</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/ErrorMessageService.html" data-type="entity-link" >ErrorMessageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EventDisplayService.html" data-type="entity-link" >EventDisplayService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileLoaderService.html" data-type="entity-link" >FileLoaderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GlobalErrorHandler.html" data-type="entity-link" >GlobalErrorHandler</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/AttributePipe.html" data-type="entity-link" >AttributePipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
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
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});