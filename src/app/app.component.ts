import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscriber, Subscription } from 'rxjs';
import { ZapFilter, ZapListing, ZapService } from './zap.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ng-quintozap';
  listings!: ZapListing[];

  filterForm: FormGroup;

  mapParams!: {
    center: google.maps.LatLngLiteral,
    bounds?: google.maps.LatLngBoundsLiteral
  };

  zapSubs!: Subscription;

  constructor(
    fb: FormBuilder,
    private zapService: ZapService
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
    const currentFilter: ZapFilter = {
      mapParams: this.mapParams,
      ...this.filterForm.value
    };
    this.listings = [ ];
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
      this.listings = this.listings.concat(filtered);
      if (!this.listings.length) {
        setTimeout(this.filter.bind(this), 1000);
      }
    });
  }
}
