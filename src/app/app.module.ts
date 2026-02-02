import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WhiteboardComponent } from './components/whiteboard/whiteboard.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    WhiteboardComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
