import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class JsonLoaderService {

  constructor(private http: HttpClient) {
  }

  public get(url: string) {
    return this.http.get(url);
  }
}
