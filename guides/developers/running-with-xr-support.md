# Running with XR support

Running Phoenix with XR support requires SSL/HTTPS to be enabled. There is a script to run the Phoenix application with SSL.

Just navigate to `packages/phoenix-ng` in the terminal and use this command:

```sh
yarn start:ssl
```

Now navigate to `https://localhost:4200` (notice the **https**) in your browser and you should have SSL enabled.\
**NOTE:** You may see a "Security Risk" warning that you will need to accept.

## Debugging XR in the browser

Check out the [WebXR API Emulator extension](https://github.com/MozillaReality/WebXR-emulator-extension#how-to-use) to test and debug XR directly in the browser.
