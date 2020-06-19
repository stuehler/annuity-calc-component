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
    return this.httpClient.get<Configuration>(`${this.servicesUrl}/annuityCalcConfig.json`, this.httpOptions);
  }
}