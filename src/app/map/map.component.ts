import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from "rxjs";
import { map, catchError, debounceTime, tap } from "rxjs/operators";
import { GoogleMap } from "@angular/google-maps";
import { ZapListing } from "../zap.service";
import { environment } from "src/environments/environment";
import { QuintoHit } from "../quinto.service";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnChanges {
  @Input() zapListings!: ZapListing[];
  @Input() quintoListings!: QuintoHit[];
  @Output() boundsChanged: EventEmitter<google.maps.Map<Element>> = new EventEmitter<google.maps.Map<Element>>();
  @Output() zapClicked: EventEmitter<ZapListing> = new EventEmitter<ZapListing>();
  @Output() quintoClicked: EventEmitter<QuintoHit> = new EventEmitter<QuintoHit>();
  @ViewChild(GoogleMap) gMap!: GoogleMap;
  @ViewChild('mapWrapper') mapWrapper!: ElementRef;

  apiLoaded!: Observable<boolean>;
  options: google.maps.MapOptions = {
    center: { lat: -22.947852563718513, lng: -43.30149955088697 },
    mapTypeId: 'roadmap',
    zoom: 12
  };

  boundsChangedSubject: Subject<void> = new Subject<void>();

  wrapperBounds!: { width: number, height: number };

  constructor(httpClient: HttpClient) {
    const mapsKeyApi = `${environment.apiPrefix}/api/googlemapsapikey`;
    httpClient.get(`${location.origin}${mapsKeyApi}`, { responseType: 'text' }).subscribe(key => {
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

    const savedMapOptionsJson = localStorage.getItem('mapOptions');
    if (savedMapOptionsJson && savedMapOptionsJson !== 'undefined') {
      const savedMapOptions = JSON.parse(savedMapOptionsJson);
      this.options = savedMapOptions;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.zapListings) {
      console.log('zap listings changed');
    }

    if (changes.quintoListings) {
      console.log('quinto listings changed');
    }
  }

  onMapLoaded() {
    console.log('map loaded', this.gMap);
  }

  onBoundsChanged() {
    const map = this.gMap.googleMap;
    this.boundsChanged.emit(map);
    this.updateMapOptions();
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
    const toSave = JSON.stringify(options);
    localStorage.setItem('mapOptions', toSave);
  }

  get center() {
    return this.gMap.googleMap?.getCenter().toJSON();
  }

  onZapListingClick(listing: ZapListing) {
    this.zapClicked.next(listing);
  }

  onQuintoListingClick(listing: QuintoHit) {
    this.quintoClicked.next(listing);
  }

  getRectLeft(position?: google.maps.LatLngLiteral) {
    if (!position) {console.log(position); return 0;}
    const mapBounds = this.gMap.getBounds()?.toJSON();
    if (!mapBounds) return 0;
    const { width } = this.wrapperBounds;
    const mapWidth = mapBounds.east - mapBounds.west;
    const left = (position.lng - mapBounds.west) * width / mapWidth;
    return left;
  }

  getRectTop(position?: google.maps.LatLngLiteral) {
    if (!position) return 0;
    const mapBounds = this.gMap.getBounds()?.toJSON();
    if (!mapBounds) return 0;
    const { height } = this.wrapperBounds;
    const mapHeight = mapBounds.south - mapBounds.north;
    const top = (position.lat - mapBounds.north) * height / mapHeight;
    return top;
  }
}
