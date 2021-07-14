import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MapModule } from './map/map.module';
import { ZapService } from './zap.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuintoService } from './quinto.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MapModule,
    MatSidenavModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  providers: [
    ZapService,
    QuintoService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
