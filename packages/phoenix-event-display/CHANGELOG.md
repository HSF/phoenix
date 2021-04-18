# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.6.0](https://github.com/HSF/phoenix/compare/v1.5.0...v1.6.0) (2021-04-18)


### Bug Fixes

* **app:** add sphericalToCartesian method ([bbea6b0](https://github.com/HSF/phoenix/commit/bbea6b03023cc56b5572684ec3cfaeb8cf3f0e7f))
* **event-display:** add back in geometrical limits for clusters ([0b95e5b](https://github.com/HSF/phoenix/commit/0b95e5b9263442df35f0af6f88694e7e5ee90e90))
* **event-display:** add eta and phi cuts for tracks ([f8a0080](https://github.com/HSF/phoenix/commit/f8a0080b3ddd8ca79ff49ae1aa1faab66b6b4e56))
* **event-display:** add missing docs ([c9781e5](https://github.com/HSF/phoenix/commit/c9781e5c0f876ea752a07178f072d82c45f50846))
* **event-display:** add missing documentation ([236bdf4](https://github.com/HSF/phoenix/commit/236bdf48b49ad0538461ac636bcbf130ef4349f9))
* **event-display:** calocluster eta position was wrong. ([66cbbc0](https://github.com/HSF/phoenix/commit/66cbbc03b5592775ee1971b0f181aaf5319636f3))
* **event-display:** cleanup JixeXML loader ([6a834e8](https://github.com/HSF/phoenix/commit/6a834e8bb3ebfbb67110e3f2e5459fc88c11d6e8))
* **event-display:** prettier fixes ([7528ee0](https://github.com/HSF/phoenix/commit/7528ee0c372c23418795866a3e041bbbb5e48d26))
* **event-display:** run prettier (again) ([f279898](https://github.com/HSF/phoenix/commit/f279898dd34fe2e79774611397e1860f761f0b54))
* **event-display:** use BufferGeometry for CMS objects with new three.js update ([b8e88b8](https://github.com/HSF/phoenix/commit/b8e88b8f88ba543fdbe43c95edf9955efd570780))


### Features

* **app:** bind clipping state with UI menu ([40bbba0](https://github.com/HSF/phoenix/commit/40bbba07311d6c23b59d5d5409d190c2721bc395))
* **app:** complete dialog for share link and embed ([50c2584](https://github.com/HSF/phoenix/commit/50c2584107d132e8f7161c28ce4d88479e30c4ed))
* **app:** setup link share form ([b10bb7a](https://github.com/HSF/phoenix/commit/b10bb7aa14e373191bea6508d723c79c42c3f2b3))
* **event-display:** ability to remove geometry in Phoenix menu ([7d90d72](https://github.com/HSF/phoenix/commit/7d90d72e4c17776855946cc3a4d80149242c4a4f))
* **event-display:** ability to scale CaloClusters ([ff666e2](https://github.com/HSF/phoenix/commit/ff666e2c8455dbf0316e220f008bf45bccb22228))
* **event-display:** add ability to scale clusters in just one direction ([5a562ab](https://github.com/HSF/phoenix/commit/5a562ab6d7d8a228d5c69ea5454a597372810e48)), closes [#257](https://github.com/HSF/phoenix/issues/257)
* **event-display:** add coordinate helper ([57e438f](https://github.com/HSF/phoenix/commit/57e438fd8ba22e525595a72425d9000c82988dc1))
* **event-display:** add guidelines and simplify some coordinate transformations ([56f94f0](https://github.com/HSF/phoenix/commit/56f94f043b5bdf5e521c05e0bc058186c78270ad))
* **event-display:** Add missing energy ([6ef17d0](https://github.com/HSF/phoenix/commit/6ef17d07d8101da845b7efa0eb6698d99490bcd8))
* **event-display:** add opacity and wireframe for CaloClusters ([85d4a14](https://github.com/HSF/phoenix/commit/85d4a14ab1afc4518684128619824f46eda3aa9d))
* **event-display:** add support for HitLines ([455f536](https://github.com/HSF/phoenix/commit/455f536a201a3bd228ac2c97bec3f45b3e769620))
* **event-display:** add types for dat.GUI ([7632a18](https://github.com/HSF/phoenix/commit/7632a180c79d2cb04fc1ec82a580bc166ab9ed4a))
* **event-display:** create an active observable variable ([854e543](https://github.com/HSF/phoenix/commit/854e5439a1ebeba80940989a716338f1542984db))
* **event-display:** improve grid lines ([ca3cc2f](https://github.com/HSF/phoenix/commit/ca3cc2fa98c2bfc6f43bc6a459d7da273e6afc5a))
* **event-display:** improve handling of UI menus in UI manager ([b7a324a](https://github.com/HSF/phoenix/commit/b7a324a6643a2e191483d9925ea467afb933def8))
* **event-display:** introduce new URL options and improve handling them ([f7cd6b4](https://github.com/HSF/phoenix/commit/f7cd6b4b6059db82900bc9a0245d8365a5917e8b))
* **event-display:** JiveXML : add support for more hit types ([bbcdf0c](https://github.com/HSF/phoenix/commit/bbcdf0c3ae090b693fa5fa3cf02c78fe2c50bf16))
* **event-display:** keep state of event data folder on event switch ([b52282f](https://github.com/HSF/phoenix/commit/b52282ff038d081ed752ab6c85d08bcc7145c822))
* **event-display:** make Phoenix available in browser without a namespace ([5389282](https://github.com/HSF/phoenix/commit/5389282be8018191426da02140cd29dcdbf2b726))
* **event-display:** move opacity and wireframing to collection level ([6486982](https://github.com/HSF/phoenix/commit/6486982fbfdca3a8e51d05afd14804e86bb9fb14))
* **event-display:** options for CaloClusters ([68cd7ad](https://github.com/HSF/phoenix/commit/68cd7ad7b7f07c558d0a98c153382404375a6288))
* **event-display:** Remove LineHits and use hits to extend tracks ([30b5160](https://github.com/HSF/phoenix/commit/30b5160ce9db8cbe800b3393271224a014b0aecf))
* **event-display:** restructure phoenix-event-display ([2e16371](https://github.com/HSF/phoenix/commit/2e163718ce32dd0713100f632127ac0a2cca8238))
* **event-display:** separate dat.GUI UI menu ([29093a2](https://github.com/HSF/phoenix/commit/29093a22737e3c9771dc4b5ca52569962b994771))
* **event-display:** separate Phoenix menu UI from UI manager ([5743adc](https://github.com/HSF/phoenix/commit/5743adcd4b6f3fb16dac3be6211450f2f04b94d3))
* **event-display:** split dat.GUI menu options ([45a0123](https://github.com/HSF/phoenix/commit/45a0123892092c9397a80b5c99bb9d5c156aa0b1))
* **event-display:** start splitting UI manager ([56ff275](https://github.com/HSF/phoenix/commit/56ff275013772e958818c3100165587aa244173f))
* **event-display:** use run and event number and file name for config json ([03a1de4](https://github.com/HSF/phoenix/commit/03a1de4056c8e9acb29307b2efb906ac7e782201))
* upgrade all packages except three.js ([8e2eff4](https://github.com/HSF/phoenix/commit/8e2eff4b58e02f19cefd3e02e7edf92a81474783))
* upgrade three.js except for CMSObjects ([0b2dd8a](https://github.com/HSF/phoenix/commit/0b2dd8a8860ed49feb16a247b52aa0b21452a251))






# [1.5.0](https://github.com/HSF/phoenix/compare/v1.4.1...v1.5.0) (2021-03-24)


### Bug Fixes

* **event-display:** catch VR request session error ([d2874b8](https://github.com/HSF/phoenix/commit/d2874b8aed6f0647f5ccb11bfade1f9c1bc1f29c))
* **event-display:** fix jsroot loading root file ([8cbcaa5](https://github.com/HSF/phoenix/commit/8cbcaa5d2e4ba89940d65d217e302e7500305641))
* **event-display:** handle tracks with no positions ([3b1991c](https://github.com/HSF/phoenix/commit/3b1991c9789607beb69374bf963b8d49eea310b6))
* **event-display:** improve renderer init ([a8f8353](https://github.com/HSF/phoenix/commit/a8f83533970cfa9129ba015b5903eb7c832d7b94))
* **event-display:** remove optimize controls function ([266af04](https://github.com/HSF/phoenix/commit/266af044e8d719732bb2dc197ec8a7b3cadc00cd))
* **event-display:** remove redundant import ([359d353](https://github.com/HSF/phoenix/commit/359d3533d275f7871cc794a6c2ff13753618f9fa))
* **event-display:** use per physics object color and not collection color ([ac0c4f1](https://github.com/HSF/phoenix/commit/ac0c4f149c36568b5f172d24656c7d754df7b635))
* remove JSROOT source files from repo ([7bcd7ba](https://github.com/HSF/phoenix/commit/7bcd7bad7bca398242697828ae3189927ff37e89))


### Features

* **app:** ability to import ig archive in CMS ([9540af5](https://github.com/HSF/phoenix/commit/9540af5d08ab2867e6ef0496a1bd1e3215e91af7))
* **app:** Add more realistic geometry for ATLAS ([d207bad](https://github.com/HSF/phoenix/commit/d207bad4f72f9ae5e423c61fa7dc56eebc99c3b7))
* **event-display:** allow resize and improve tests and drop improving CPU usage ([a474af2](https://github.com/HSF/phoenix/commit/a474af23b05766e2f5ae32850cf9338603ed1cc3))
* **event-display:** resize canvas with window resize ([5ea04f1](https://github.com/HSF/phoenix/commit/5ea04f174b5adbe54af0aa4663466c5b6291c0a2))
* **event-display:** update to use CDN for JSROOT ([2fa310f](https://github.com/HSF/phoenix/commit/2fa310fc0171bd19e0ec1b75322eba6b532e5bfe))
* **event-display:** use latest version of JSROOT ([fbd584e](https://github.com/HSF/phoenix/commit/fbd584edb3dbfd436cdbe18a876c59ec05e43aa4))






# [1.4.0](https://github.com/HSF/phoenix/compare/v1.3.0...v1.4.0) (2021-02-16)


### Bug Fixes

* **event-display:** disable keyboard controls when typing ([4f80bd6](https://github.com/HSF/phoenix/commit/4f80bd6c972f2e1291bc62015870ac9b08c077ef))
* **event-display:** improve object selection from uuid and label input ([3475836](https://github.com/HSF/phoenix/commit/3475836eacca1485f6dddab8dc049bbb605a5e27))
* **event-display:** persist toggle state of phoenix menu node children ([e96136b](https://github.com/HSF/phoenix/commit/e96136b8bade393d336a74c607db18d19d139e96))
* **event-display:** remove rollup config and fix globalThis usage ([e6f69a0](https://github.com/HSF/phoenix/commit/e6f69a0e47856dc38409eaea3030595fa5c3065d))


### Features

* **event-display:** ability to add 3D label text ([c9d4880](https://github.com/HSF/phoenix/commit/c9d4880c2ef97ee07f16a30ef17c80279c853de3))
* **event-display:** add labels configuration to dat.GUI menu ([d677089](https://github.com/HSF/phoenix/commit/d677089d49a5fedee4b23bcc690690decef5f8a2))
* **event-display:** add labels to UI configuration ([d90e3a6](https://github.com/HSF/phoenix/commit/d90e3a6435e869138417f2bff705f4fde4825d5a))
* **event-display:** add size and color options for labels ([3ce675f](https://github.com/HSF/phoenix/commit/3ce675f3da5db67a40f32be7f011c393a98055c2))
* **event-display:** better handling of labels object ([e10a68d](https://github.com/HSF/phoenix/commit/e10a68d91cb18e82debd470a2dff643b41031d85))
* **event-display:** complete setup with webpack for browser ([3f6367f](https://github.com/HSF/phoenix/commit/3f6367fa52cdb0b116b93428b03a97e4b816f094))
* **event-display:** complete support to save and load labels ([2219a3e](https://github.com/HSF/phoenix/commit/2219a3e60ef8bda46e4f1c6d1fa219a21e96451a))
* **event-display:** create a url options manager for url options ([fe0b2e6](https://github.com/HSF/phoenix/commit/fe0b2e66ff5485821620d53870a394d52cc1a460))
* **event-display:** create generic function for getting object position ([8d7b160](https://github.com/HSF/phoenix/commit/8d7b160b1e70df425f4626a5d3c89320d4571de4))
* **event-display:** delete label on empty value and change add label icon ([3756330](https://github.com/HSF/phoenix/commit/3756330d06c459662a0e99d447e5984ebea87e27))
* **event-display:** make label always look at camera ([0837334](https://github.com/HSF/phoenix/commit/08373349a7c5a47c10ec22a58bd6337823f02214))
* **event-display:** set up add label to object functions ([db261a6](https://github.com/HSF/phoenix/commit/db261a6fe5b770f912bef080f1ceec6374a81d08))
* **event-display:** setup webpack for browser bundle ([dc05ed9](https://github.com/HSF/phoenix/commit/dc05ed9cad08d99f2a2e8c27b97257a8d3ff11f1))
* **event-display:** support to hide widgets through URL ([cb2ec40](https://github.com/HSF/phoenix/commit/cb2ec4096b7cba0c1516d14b6f32e294673818a6))
* **event-display:** use optional chaining for hide widgets url option ([c991e54](https://github.com/HSF/phoenix/commit/c991e54dc4dbeb7a85228217317cda08835e5c16))
* **event-display:** Use types for phoenix menu configuration ([79e6d7c](https://github.com/HSF/phoenix/commit/79e6d7c17e4a78f9a571c0eba98eacf76906c029))
* **event-display:** working labels object ([60269f7](https://github.com/HSF/phoenix/commit/60269f78eb0c384bd628680c93ae94919b2d08d9))
* Update Angular and all packages to latest ([f4c2e31](https://github.com/HSF/phoenix/commit/f4c2e31207e890436a6387e2e34ef31e3d0c48a6))





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
