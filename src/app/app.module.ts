import { BrowserModule } from '@angular/platform-browser';
import { NgModule, DoBootstrap, Injector } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';

import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { InvestorDetailsComponent } from './main/investor-details/investor-details.component';
import { LabelInputGroupComponent } from './main/label-input-group/label-input-group.component';
import { HistogramComponent } from './main/histogram/histogram.component';
import { ProgressButtonComponent } from './progress-button/progress-button.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    InvestorDetailsComponent,
    LabelInputGroupComponent,
    HistogramComponent,
    ProgressButtonComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [],
  entryComponents: [AppComponent]
})
export class AppModule implements DoBootstrap {

  constructor(private injector: Injector) {
    const webComponent = createCustomElement(AppComponent, { injector });
    customElements.define('annuity-calc', webComponent);
  }

  ngDoBootstrap() { }
}
