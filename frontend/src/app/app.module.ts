import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    // Remove AppComponent from here since it's standalone
  ],
  imports: [
    BrowserModule,
    HttpClientModule, // Import HttpClientModule instead of HttpClient
    AppComponent // Import the standalone component here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }