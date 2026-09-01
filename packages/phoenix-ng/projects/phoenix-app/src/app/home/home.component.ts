import { Component, type AfterViewInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
import { versionInfo } from '../../environments/version';

const REPO_URL = 'https://github.com/HSF/phoenix';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  year: number;

  /** Version to show in the footer, e.g. "v4.0.1" or "4.0.1-dev (38d262c4)". */
  readonly versionLabel: string;
  /** Where the footer version links to: the release, or the commit it was built from. */
  readonly versionLink: string;

  constructor(private eventDisplay: EventDisplayService) {
    this.year = new Date().getFullYear();

    const { version, commit, isRelease } = versionInfo;
    if (isRelease) {
      this.versionLabel = `v${version}`;
      this.versionLink = `${REPO_URL}/releases/tag/v${version}`;
    } else {
      // commit is empty when the build had no access to git history
      this.versionLabel = commit
        ? `${version}-dev (${commit})`
        : `${version}-dev`;
      this.versionLink = commit ? `${REPO_URL}/commit/${commit}` : REPO_URL;
    }

    this.eventDisplay.getThreeManager().stopAnimationLoop();
  }

  ngAfterViewInit() {
    this.eventDisplay.getUIManager().detectColorScheme();
  }
}
