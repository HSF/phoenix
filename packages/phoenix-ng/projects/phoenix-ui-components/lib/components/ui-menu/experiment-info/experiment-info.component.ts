import { Component, type OnInit, type OnDestroy, Input } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  standalone: false,
  selector: 'app-experiment-info',
  templateUrl: './experiment-info.component.html',
  styleUrls: ['./experiment-info.component.scss'],
})
export class ExperimentInfoComponent implements OnInit, OnDestroy {
  experimentInfo: any[];
  @Input() url: string;
  @Input() logo: string;
  @Input() tagline: string;
  private unsubscribe: () => void;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit(): void {
    this.unsubscribe = this.eventDisplay.listenToDisplayedEventChange(() => {
      this.experimentInfo = this.eventDisplay.getEventMetadata();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }
}
