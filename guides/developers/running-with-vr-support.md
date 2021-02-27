# Running with VR support

Running Phoenix with VR support requires SSL/HTTPS to be enabled. There is a script to run the Phoenix application with SSL.

Just navigate to `packages/phoenix-ng` in the terminal and use this command:

```sh
yarn start:ssl
```

Now navigate to `https://localhost:4200` (notice the **https**) in your browser and you should have SSL enabled.\
**NOTE:** You may see a "Security Risk" warning that you will need to accept.

## Debugging VR in the browser

Check out the [WebXR API Emulator extension](https://github.com/MozillaReality/WebXR-emulator-extension#how-to-use) to test and debug VR directly in the browser.
