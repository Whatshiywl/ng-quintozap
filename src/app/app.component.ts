import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { QuintoHit, QuintoService } from './quinto.service';
import { ZapListing, ZapService } from './zap.service';

export interface Filter {
  mapParams?: {
    center: google.maps.LatLngLiteral,
    bounds?: google.maps.LatLngBoundsLiteral
  },
  minPrice: number,
  maxPrice: number,
  size?: number,
  page?: number
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ng-quintozap';
  zapListings!: ZapListing[];
  quintoListings!: QuintoHit[];

  filterForm: FormGroup;

  mapParams!: {
    center: google.maps.LatLngLiteral,
    bounds?: google.maps.LatLngBoundsLiteral
  };

  zapSubs!: Subscription;
  quintoSubs!: Subscription;

  constructor(
    fb: FormBuilder,
    private zapService: ZapService,
    private quintoService: QuintoService
  ) {
    this.filterForm = fb.group({
      minPrice: fb.control(undefined),
      maxPrice: fb.control(undefined),
    });

    const savedJson = localStorage.getItem('filters');
    if (savedJson) {
      const saved = JSON.parse(savedJson);
      this.filterForm.setValue(saved);
    }

    this.filterForm.valueChanges.subscribe(value => {
      const toSave = JSON.stringify(value);
      localStorage.setItem('filters', toSave);
    });
  }

  onBoundsChanged(map: google.maps.Map<Element>) {
    const center = map.getCenter().toJSON();
    const bounds = map.getBounds()?.toJSON();
    this.mapParams = { center, bounds };
    this.filter();
  }

  filter() {
    this.filterZap();
    this.filterQuinto();
  }

  filterZap() {
    const currentFilter: Filter = {
      mapParams: this.mapParams,
      ...this.filterForm.value
    };
    this.zapListings = [ ];
    if (this.zapSubs) this.zapSubs.unsubscribe();
    this.zapSubs = this.zapService.getZap(currentFilter).subscribe(result => {
      const filtered = result.filter(el => {
        const rent = el.listing.fullRentalPrice || 0;
        const { minPrice, maxPrice } = this.filterForm.value;
        if (minPrice && rent < minPrice) return false;
        if (maxPrice && rent > maxPrice) return false;
        return true;
      });
      console.log(filtered);
      this.zapListings = this.zapListings.concat(filtered);
      if (!this.zapListings.length) {
        setTimeout(this.filterZap.bind(this), 1000);
      }
    });
  }

  filterQuinto() {
    const currentFilter: Filter = {
      mapParams: this.mapParams,
      ...this.filterForm.value
    };
    this.quintoListings = [ ];
    if (this.quintoSubs) this.quintoSubs.unsubscribe();
    this.quintoSubs = this.quintoService.getZap(currentFilter).subscribe(result => {
      const filtered = result.filter(el => {
        const rent = el._source.totalCost;
        const { minPrice, maxPrice } = this.filterForm.value;
        if (minPrice && rent < minPrice) return false;
        if (maxPrice && rent > maxPrice) return false;
        return true;
      });
      console.log(filtered);
      this.quintoListings = this.quintoListings.concat(filtered);
      if (!this.quintoListings.length) {
        setTimeout(this.filterQuinto.bind(this), 1000);
      }
    });
  }
}
