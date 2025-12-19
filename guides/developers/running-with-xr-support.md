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

## Using the new XR UI

You can now start XR sessions directly from the Phoenix UI:

- In dat.GUI: open the `XR` folder and click `Enter VR` or `Enter AR`. Use `AR DOM overlay` to show Phoenix overlays on top of the AR scene, and `Exit XR` to leave.
- In the Phoenix menu: open the `XR` section and use the same actions (`Enter VR`, `Enter AR`, `AR DOM overlay`, `Exit XR`).
- In the Angular app UI: the top UI menu includes `VR` and `AR` toggles that call into the same XR session handlers.

Notes:
- WebXR requires a compatible browser/device and HTTPS. When developing locally, use the SSL start script above.
- AR scales the scene down and reduces camera near to suit real-world scale. Exiting AR restores previous values automatically.
