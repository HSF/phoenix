import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';
import { HttpClient } from '@angular/common/http';
import { Vector3 } from 'three';
import { RungeKutta } from '../../services/extras/runge-kutta';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {

  constructor(protected eventDisplay: EventdisplayService, protected http: HttpClient) { }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];
    this.eventDisplay.init(configuration);
  }

  runRungeKutta() {

    // Testing Runge-Kutta

    let start = new Vector3(0, 0, 0);
    let dir = new Vector3(1, 1, 1);
    dir = RungeKutta.normalizeVector(dir);

    let q = 1; // charge
    let p = 500; // momentum

    console.log('----------- Propagation Test -----------');
    let traj = RungeKutta.propagate(start, dir, p, q, -1., 1000.0);
    console.log(' - yielded ', traj.length, 'steps');
    console.log('----------------------------------------');

    let resultStr: string = '';
    for (const step of traj) {
      resultStr += 'v ' + step.pos.x
                  + ' ' + step.pos.y
                  + ' ' + step.pos.z
                  + '\n';
    }

    for (let iv = 2; iv <= traj.length; ++iv) {
      resultStr += 'l ' + (iv - 1) + ' ' + iv + '\n';
    }

    let blob = new Blob([resultStr], { type: 'text/plain' });

    this.saveFile(blob, 'Track.obj');
  }

  saveFile(blob, filename) {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}
