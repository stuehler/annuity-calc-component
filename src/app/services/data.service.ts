import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Configuration } from '../model/model';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  servicesUrl: string;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  constructor(
    private httpClient: HttpClient
  ) {
    this.servicesUrl = environment.servicesUrl;
  }

  public getConfiguration(): Observable<Configuration> {
    if (window.location.href.includes("http://localhost:")) {
      return this.httpClient.get<Configuration>(`assets/data/annuityCalcConfig.json`, this.httpOptions);
    } else {
      return this.httpClient.get<Configuration>(`${this.servicesUrl}/annuityCalcConfig.json`, this.httpOptions);
    }
  }
}