import { NgModule } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

import { MapComponent } from './map.component';

import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { ListingsComponent } from '../listings/listings.component';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    MapComponent,
    ListingsComponent
  ],
  imports: [
    CommonModule,
    GoogleMapsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    MatBadgeModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    MapComponent,
  ],
})
export class MapModule { }
