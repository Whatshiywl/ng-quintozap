import { NgModule } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

import { MapComponent } from './map.component';

import { MatBadgeModule } from '@angular/material/badge';

@NgModule({
  declarations: [
    MapComponent,
  ],
  imports: [
    CommonModule,
    GoogleMapsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    MatBadgeModule
  ],
  exports: [
    MapComponent,
  ],
})
export class MapModule { }
