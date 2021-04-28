# Release

This guide highlights the release process for Phoenix packages.\
If you are not a part of Phoenix on npm and want to make a release, you can ask [9inpachi](https://github.com/9inpachi) or [EdwardMoyse](https://github.com/EdwardMoyse) to add you to the npm org.

We currently publish the packages `phoenix-event-display`and `phoenix-ui-components` to npm.

## Checklist

For a smooth release make sure to check the following points.

* The repository's origin is set to `HSF/phoenix`.  
  `git remote set-url origin https://github.com/HSF/phoenix.git`
* Angular is globally installed on the system.  
  `npm install --global @angular/cli`
* Clean `phoenix-ui-components` by removing the `dist` and `__ivy_ngcc__` directories in [`packages/phoenix-ng/projects/phoenix-ui-components`](../packages/phoenix-ng/projects/phoenix-ui-components) if any.

## Release process

In the terminal, navigate to the root directory of the Phoenix repo.\
Then, login to npm in the terminal to be able to publish the packages.

```sh
npm login
```

You will also need a GitHub token with write permission for pushing the Git release tag. Follow [this guide](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) to get the access token.\
Then you need to set the `GH_TOKEN` environment variable in your terminal when running the release commands.

The release commands will then be structured like:

```sh
GH_TOKEN=<your_gh_token> yarn release:<version_priority>
```

Here's a list of the release commands.

* `yarn release`
  * Will release a patch version of all the packages. (1.0.x where x will be updated)
* `yarn release:minor`
  * Will release a minor version of all the packages. (1.x.0 where x will be updated)
* `yarn release:major`
  * Will release a major version of all the packages. (x.0.0 where x will be updated)
* `yarn release:pre`
  * Will prerelease a patch version. (1.0.0-alpha-x - alpha suffix will be added and x will be updated with each release)
* `yarn release:graduate`
  * Will graduate a prerelease (the one we did above) to a full stable version removing the alpha suffix from the version. (If you don't graduate a prerelease, the normal release commands (`yarn release:major`, `yarn release` etc.) will also prerelease with the alpha suffix)
* All `yarn release:<version_priority>` commands will
   1) Release all the packages (`phoenix-event-display` and `phoenix-ui-components`).
   2) Deploy the API docs.
   3) Deploy the Angular application.
   4) Push a release tag to GitHub.
