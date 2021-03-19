# Contributing

## 1. Issue tracking

The best way to start contributing is to explore the GitHub issue tracker for the repository.

If you have already tried the application feel free to open an issue if you notice any bug or feature that could be improved.

Include a brief description and context of the issue, and optionally choose labels to mark the issue as `bug`, `enhancement`, `question`...
to give extra information to other developers.

## 2. Coding

Once you are decided to start contributing on the repository, take a look at the [Developer guide](./guides/developers#readme) to get a more detailed understanding.

### Code formatting

We use [Prettier](http://github.com/prettier/prettier) as a tool for code formatting which you can set up with your editor with [these instructions](https://prettier.io/docs/en/editors.html). We also have scripts to check and update code with Prettier.

To check if the code is formatted:

```sh
yarn prettier:check
```

To automatically format the code:

```sh
yarn prettier:write
```

## 3. Commit messages

For commit messages, we follow a tweaked version of [angular commit convention](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit).

Namely, every message should consist of:

```
<header>
<body>
```

The `header` is mandatory and must conform to the `Commit Message Header` format (see below).

The `body` is encouraged, and should describe in more detail what is being changed.

### Commit message header

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: app | event-display
  │
  └─⫸ Commit Type: feat | fix | docs | style | build
```

Here is an example of a documentation improvement for the `phoenix-app` package:

```
docs(app): Added some text about commit rules
Lets add some rules for our commit messages, 
based on the angular commit conventions.
```

## 4. Pull Requests

When creating a `Pull Request` please include a short description explaining what has changed and why. If applicable, screenshots or GIF capture about the fix or improvement will really help.
This will help others reviewing your code so you may also reference any issues that you were working on fixing.

Finally choose a meaningful title so your pull request can be easily identified

## Thanks!

Your contribution is very appreciated, thank you!
