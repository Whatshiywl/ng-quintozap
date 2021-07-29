import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { merge, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { PreferencesService } from './preferences.service';
import { CommonListing, InfoComponent, ListingResult } from './info/info.component';
import { QuintoService } from './quinto.service';
import { ZapService } from './zap.service';

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
  listings: CommonListing[] = [];

  filterForm: FormGroup;
  autoSearch: FormControl;

  mapParams!: {
    center: google.maps.LatLngLiteral,
    bounds?: google.maps.LatLngBoundsLiteral
  };

  listingSubs!: Subscription;

  hideSeen = false;

  constructor(
    fb: FormBuilder,
    private zapService: ZapService,
    private quintoService: QuintoService,
    private dialog: MatDialog,
    private preferences: PreferencesService
  ) {
    this.filterForm = fb.group({
      minPrice: fb.control(undefined),
      maxPrice: fb.control(undefined),
    });

    this.preferences.valueChanges.subscribe(pref => {
      this.hideSeen = pref.hideSeen;
      this.filterForm.setValue(pref.filters, { emitEvent: false });
      this.autoSearch.setValue(pref.autoSearch, { emitEvent: false });
    });

    this.filterForm.valueChanges.subscribe(value => {
      this.preferences.save('filters', value);
    });

    this.autoSearch = fb.control(true);

    this.autoSearch.valueChanges.subscribe(enabled => {
      this.preferences.save('autoSearch', enabled);
      if (enabled) this.filter();
    });

    merge(
      this.zapService.listings$,
      this.quintoService.listings$
    )
    .pipe(map(this.filterByPrice.bind(this)))
    .subscribe(({ origin, results, filter }) => {
      if (results.length) {
        console.log('listings', origin, results);
        this.listings = this.listings
        .filter(listing => listing.origin !== origin)
        .concat(results);
      } else {
        console.log('retry', origin);
        setTimeout(() => {
          const service = origin === 'zap' ? this.zapService : this.quintoService;
          service.filter(filter);
        }, 1000);
      }
    });
  }

  onBoundsChanged(map: google.maps.Map<Element>) {
    const center = map.getCenter().toJSON();
    const bounds = map.getBounds()?.toJSON();
    this.mapParams = { center, bounds };
    if (this.autoSearch.value) this.filter();
  }

  filter() {
    if (!this.mapParams) return;
    const currentFilter: Filter = {
      mapParams: this.mapParams,
      ...this.filterForm.value
    };
    this.zapService.filter(currentFilter);
    this.quintoService.filter(currentFilter);
  }

  filterByPrice(result: ListingResult) {
    return {
      origin: result.origin, filter: result.filter,
      results: result.results.filter(listing => {
        const rent = listing.totalCost;
        const { minPrice, maxPrice } = this.filterForm.value;
        if (minPrice && rent < minPrice) return false;
        if (maxPrice && rent > maxPrice) return false;
        return true;
      })
    };
  }

  onListingClicked(listing: CommonListing) {
    const ref = this.dialog.open(InfoComponent);
    ref.componentInstance.setListing(listing);
  }

  onToggleHideSeen() {
    this.hideSeen = !this.hideSeen;
    this.preferences.save('hideSeen', this.hideSeen);
  }
}
