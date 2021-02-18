# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.3.0](https://github.com/HSF/phoenix/compare/v1.2.0...v1.3.0) (2021-01-16)


### Bug Fixes

* **event-display:** assign the right name to geometry ([b7e8da0](https://github.com/HSF/phoenix/commit/b7e8da002548255b0c996ebc91a06918b5819281))
* **event-display:** code improvements ([f94c0e4](https://github.com/HSF/phoenix/commit/f94c0e40384ee95f22ba1a92938cf124a6d89a31))
* **event-display:** fix parsing of GLTF geometry ([dc5d489](https://github.com/HSF/phoenix/commit/dc5d489fd2b2730b9d235851c09baf86d88325d3))
* **event-display:** improve code for hiding tube tracks ([e9f1bc9](https://github.com/HSF/phoenix/commit/e9f1bc9ef454791e567cf83c886f055c4215423c))
* **event-display:** minor script fix ([5139c6e](https://github.com/HSF/phoenix/commit/5139c6e9e9a5a3029cf1e4a6b454c0f4d8cfb42a))
* **event-display:** remove color from obj file userdata ([8ba94e7](https://github.com/HSF/phoenix/commit/8ba94e76955b9d65688ee5aaabb6d4f2d0e854f2))
* **event-display:** revert jasmine spec files ([dc140dd](https://github.com/HSF/phoenix/commit/dc140ddf33b083577782f55f4c2a8187c9501d44))
* **event-display:** try fixing CMSLoader tests ([789da8b](https://github.com/HSF/phoenix/commit/789da8b352620d485e80271283f2a133cf7d3323))


### Features

* **event-display:** display size on selection ([6943f79](https://github.com/HSF/phoenix/commit/6943f792b2eb037dd4ab19b9dc806d75820b2249))
* **event-display:** hide tube tracks on zoom ([7d606b2](https://github.com/HSF/phoenix/commit/7d606b29214e9f080266ad13502fa1092605a00f))






# [1.2.0](https://github.com/HSF/phoenix/compare/v1.1.0...v1.2.0) (2020-12-06)


### Bug Fixes

* **event-display:** add Edward's controller set up ([a6a1c19](https://github.com/HSF/phoenix/commit/a6a1c19d696aff6e6c239fef76dcd3c24f4897a1))
* **event-display:** changes to animation loop for VR ([37df19f](https://github.com/HSF/phoenix/commit/37df19f17b0f6d37229e95dacf295e388dcefbd1))
* **event-display:** finally fix VR completely ([4764196](https://github.com/HSF/phoenix/commit/4764196e4b64ee3a7d4ff0654373b893018e6e53))
* **event-display:** fix applying multiple cuts at the same time ([8f3e8e1](https://github.com/HSF/phoenix/commit/8f3e8e18f42c3f6092e7e89e73da4414e648879f))
* **event-display:** fix applying state for range slider ([c36a222](https://github.com/HSF/phoenix/commit/c36a222779a278f9aba6c774f3793e8fc44e0490))
* **event-display:** fix loading and add default view to experiments ([ab8feb4](https://github.com/HSF/phoenix/commit/ab8feb45ecd0fba4ae2eb32deb528763f166b5d3))
* **event-display:** initialize cuts with correct values ([e297c98](https://github.com/HSF/phoenix/commit/e297c984ecca0a8e0d1ac84389f8c3160b443bec))
* **event-display:** make it possible to flat shade ([dcf6cec](https://github.com/HSF/phoenix/commit/dcf6cec2556c4fb880682ac1a3559bfd44050822))
* **event-display:** optimal animation loop set up ([da3ead5](https://github.com/HSF/phoenix/commit/da3ead53b2b36e67a7d5604db5428b60ce93bffa))
* **event-display:** optimal render for effects manager ([1975d70](https://github.com/HSF/phoenix/commit/1975d701763acfe770a08ca9eba92bf46ae9e035))
* **event-display:** reset clipping on init ([029d526](https://github.com/HSF/phoenix/commit/029d526d9ae0bc6933fb6bc07e48efe6dcba2667))
* **event-display:** stop animation loop on home ([c39ecd3](https://github.com/HSF/phoenix/commit/c39ecd3d57744e5ad117de6cd0aafc2c81b5c58d))
* **event-display:** update configuration in tests ([18f8db2](https://github.com/HSF/phoenix/commit/18f8db2e7d9cf5ccbcf1111112d4fec0449fa087))


### Features

* **app:** add toggle for screenshot mode ([22a1ec8](https://github.com/HSF/phoenix/commit/22a1ec8903ac80d72f564eca29e49d15cbd411ce))
* **app:** make loader generic ([ff10477](https://github.com/HSF/phoenix/commit/ff10477b40fae8554813b283a644c6aeb421f88a))
* **app:** set up performance mode with selection ([947f6bf](https://github.com/HSF/phoenix/commit/947f6bf2f4da25528de3ab3eeb44c579c084d9a6))
* **app:** use event display loader in Angular component ([25b2a9d](https://github.com/HSF/phoenix/commit/25b2a9df57b48b0b372358f5350648e3b1b7e846))
* **event-display:** ability to add geometry to a menu folder ([30b0383](https://github.com/HSF/phoenix/commit/30b0383664419581a76457ab11189aa559fd911b))
* **event-display:** ability to initialize event display without init ([69d3f75](https://github.com/HSF/phoenix/commit/69d3f75360575c2202701e0ef28b1bdf0dec5e8a))
* **event-display:** add ability to add parametrised geometry ([04dc545](https://github.com/HSF/phoenix/commit/04dc545b3a65d990215ea0980b93ec01d8347a7c))
* **event-display:** add and set up loading manager ([5f0f942](https://github.com/HSF/phoenix/commit/5f0f9422156344c5e162cf882872ae9708d6c0bb))
* **event-display:** handle loading better ([9474565](https://github.com/HSF/phoenix/commit/9474565a2bc9b3764cb0970df14ed79a1d943a03))
* **event-display:** make loading functions return Promise for async await ([4262a1b](https://github.com/HSF/phoenix/commit/4262a1b42a8960e5e81df6bef304388e9d4ac26e))
* **event-display:** performance mode and antialias support ([d3920c4](https://github.com/HSF/phoenix/commit/d3920c4ecf8176e2918c1ac4b8d7f2d636c503e3))
* **event-display:** support for toggling antialiasing ([48130b2](https://github.com/HSF/phoenix/commit/48130b2c53a1c0a8d105f1e81ecf4f0146eb3763))
* **event-display:** use object to simplify configuration ([4b10452](https://github.com/HSF/phoenix/commit/4b10452a80aed8e67ddac5d550cc9fd15383bad3))






# [1.1.0](https://github.com/HSF/phoenix/compare/v1.0.2...v1.1.0) (2020-11-07)


### Bug Fixes

* **app:** cut filter failed if value return was zero ([0a26fea](https://github.com/HSF/phoenix/commit/0a26fea050358e0444f6f257b74e9616ce2d0a91))
* **app:** cut should be pT, not mom ([73b7c27](https://github.com/HSF/phoenix/commit/73b7c2709bf829516d94e4cf7e90c96b0016fdaf))
* **app:** fix attribute pipe ([0980379](https://github.com/HSF/phoenix/commit/09803798a1e5bef8a02e004a63a671d666d0a56a))
* **app:** fix tests ([f87c587](https://github.com/HSF/phoenix/commit/f87c5876f5a7a83ef3f0a1cb71ff345b492f4263))
* **app:** pT should always be positive ([3918159](https://github.com/HSF/phoenix/commit/3918159781673071085f163ec33f5d346f6e255b))
* **event-display:** add optional chaining to CMS event info (fixes tests) ([5283e9a](https://github.com/HSF/phoenix/commit/5283e9a5b52b79409f0aba6db1dbf144946d9d0c))
* **event-display:** fix geometry too big in overlay view ([c7a35db](https://github.com/HSF/phoenix/commit/c7a35db8ebbab1922a921425d1c8e9d643c88677))
* **event-display:** fix URL event not working with hash routes ([9eb21f5](https://github.com/HSF/phoenix/commit/9eb21f51bd5d21f14d3919def8347d94e4b8c30f))
* **event-display:** Formatted correctly ([b46c49f](https://github.com/HSF/phoenix/commit/b46c49f5358f0dc096de0e6698860c0bee132395))
* **event-display:** use optional chaining in CMS loader ([cfb1b6a](https://github.com/HSF/phoenix/commit/cfb1b6a9d49a1b812a6e7d569756a4e65899f5b7))
* **VR:** Fix bugged scene in VR mode ([9efd9ca](https://github.com/HSF/phoenix/commit/9efd9ca6cf814109a8901ce0d80eec90fc765c72))


### Features

* **app:** Option to load config from URL in ATLAS ([1906976](https://github.com/HSF/phoenix/commit/1906976f763dcb6d7748037e3f9cf4dd5796b230))
* **app:** phoenix-ui-components library ([17909eb](https://github.com/HSF/phoenix/commit/17909ebfd0e6a788933c85231410d9fa0516a428))
* **app:** yet another MAJOR refactoring ([1261358](https://github.com/HSF/phoenix/commit/1261358df183cf8fe83ccd0f8866a558a0d30221))
* **event-display:** add defaultView to configuration ([612205c](https://github.com/HSF/phoenix/commit/612205cbeba7ffcec532ab0907b81cbed079b8c0))
* **event-display:** implicitly load event data from URL ([9e3dc20](https://github.com/HSF/phoenix/commit/9e3dc20748559a38289a9cf42da40bd85c72a492))
* **event-display:** state manager for managing event display state for save and load ([7d1ca22](https://github.com/HSF/phoenix/commit/7d1ca22f5e9bfa430297597b1d4da116eaf075a2))






## <small>1.0.2 (2020-10-05)</small>

* Complete deployment set up ([399ac77](https://github.com/HSF/phoenix/commit/399ac77))






## 1.0.1 (2020-10-05)

**Note:** Version bump only for package phoenix-event-display
