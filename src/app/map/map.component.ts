import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from "rxjs";
import { map, catchError, debounceTime, tap } from "rxjs/operators";
import { GoogleMap } from "@angular/google-maps";
import { CommonListing } from "../info/info.component";
import { ListingOptions } from "../listings/listings.component";
import { PreferencesService } from "../preferences.service";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnChanges {
  @Input() listings!: CommonListing[];
  @Input() hideSeen = false;
  @Output() boundsChanged: EventEmitter<google.maps.Map<Element>> = new EventEmitter<google.maps.Map<Element>>();
  @Output() listingClicked: EventEmitter<CommonListing> = new EventEmitter<CommonListing>();
  @ViewChild(GoogleMap) gMap!: GoogleMap;
  @ViewChild('mapWrapper') mapWrapper!: ElementRef;

  apiLoaded!: Observable<boolean>;
  options!: google.maps.MapOptions;
  optionsFromStore = false;
  firstOptionsFromStore = true;

  boundsChangedSubject: Subject<void> = new Subject<void>();

  wrapperBounds!: { width: number, height: number };

  positions: {
    [key: string]: {
      position: google.maps.LatLngLiteral,
      listings: CommonListing[]
    }
  } = { };

  listingOptions: ListingOptions = {
    width: 60,
    height: 40
  };

  constructor(
    httpClient: HttpClient,
    private preferences: PreferencesService
  ) {
    const mapsKeyApi = `api/googlemapsapikey`;
    httpClient.get(`${mapsKeyApi}`, { responseType: 'text' }).subscribe(key => {
      this.apiLoaded = httpClient.jsonp(`https://maps.googleapis.com/maps/api/js?key=${key}`, 'callback')
        .pipe(
          map(() => true),
          catchError(() => of(false)),
        );
    });

    this.boundsChangedSubject.pipe(
      tap(() => {
        const element = this.mapWrapper.nativeElement as HTMLDivElement;
        const width = element.clientWidth;
        const height = element.clientHeight;
        this.wrapperBounds = { width, height };
      }),
      debounceTime(500)
    ).subscribe(this.onBoundsChanged.bind(this));
    const interval = setInterval(() => {
      if (!this.gMap) return;
      clearInterval(interval);
      this.onMapLoaded();
    }, 100);

    this.preferences.valueChanges.subscribe(pref => {
      if (!pref.mapOptions) return;
      if (this.isSameMapOptions(pref.mapOptions)) {
        return;
      }
      this.optionsFromStore = true;
      this.options = pref.mapOptions;
    });
  }

  onMapLoaded() {
    console.log('map loaded', this.gMap);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.listings) {
      this.positions = { };
      this.listings.forEach(listing => {
        const position = listing.mapPosition;
        const { lat, lng } = position;
        const resolution = 3;
        const hash = `${lat.toFixed(resolution)}|${lng.toFixed(resolution)}`;
        if (!this.positions[hash]) this.positions[hash] = {
          position,
          listings: [ ]
        };
        this.positions[hash].listings.push(listing);
      });
    }
  }

  onListingClicked(listing: CommonListing) {
    this.listingClicked.next(listing);
  }

  onBoundsChanged() {
    const map = this.gMap.googleMap;
    const options = this.updateMapOptions();
    if (options) {
      this.boundsChanged.emit(map);
    }
  }

  updateMapOptions() {
    const map = this.gMap.googleMap;
    if (!map) return;
    const center = map.getCenter().toJSON();
    const zoom = map.getZoom();
    const mapTypeId = map.getMapTypeId();
    const options: google.maps.MapOptions = {
      center, zoom, mapTypeId
    };
    if (this.optionsFromStore || !this.isSameMapOptions(options)) {
      if (!this.optionsFromStore || this.firstOptionsFromStore) {
        this.preferences.save('mapOptions', options);
        this.firstOptionsFromStore = false;
      }
      this.optionsFromStore = false;
      return options;
    }
    return;
  }

  get center() {
    return this.gMap.googleMap?.getCenter().toJSON();
  }

  getRectLeft(position?: google.maps.LatLngLiteral) {
    if (!position) {console.log(position); return 0;}
    const mapBounds = this.gMap.getBounds()?.toJSON();
    if (!mapBounds) return 0;
    const { width } = this.wrapperBounds;
    const mapWidth = mapBounds.east - mapBounds.west;
    const left = (position.lng - mapBounds.west) * width / mapWidth;
    return left - (0.5 * this.listingOptions.width);
  }

  getRectTop(position?: google.maps.LatLngLiteral) {
    if (!position) return 0;
    const mapBounds = this.gMap.getBounds()?.toJSON();
    if (!mapBounds) return 0;
    const { height } = this.wrapperBounds;
    const mapHeight = mapBounds.south - mapBounds.north;
    const top = (position.lat - mapBounds.north) * height / mapHeight;
    return top - (0.5 * this.listingOptions.height);
  }

  private isSameMapOptions(options: google.maps.MapOptions) {
    if (this.options === options) return true;
    if (this.options?.zoom !== options?.zoom) return false;
    if (this.options?.mapTypeId !== options?.mapTypeId) return false;
    if (this.options?.center?.lat !== options?.center?.lat) return false;
    if (this.options?.center?.lng !== options?.center?.lng) return false;
    return true;
  }
}
