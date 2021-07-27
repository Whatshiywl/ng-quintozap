import { Component } from "@angular/core";
import { Clipboard } from "@angular/cdk/clipboard";

import SwiperCore, {
  Keyboard,
  Mousewheel
} from 'swiper/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { Filter } from "../app.component";
import { QuintoService } from "../quinto.service";
import { StorageService } from "../storage.service";

export type ListingOrigin = 'zap' | 'quinto';

export interface CommonListing {
  class: 'zap-listing' | 'quinto-listing',
  origin: ListingOrigin,
  id: string,
  originalId: string,
  title: string,
  totalCost: number
  area: number,
  areaPerThousand: number,
  link: string,
  pictures: string[],
  pictureCaptions: string[],
  rooms: number,
  mapPosition: google.maps.LatLngLiteral,
  seen: boolean,
  favorite: boolean,
  firstPublicationDate?: Date,
  lastPublicationDate?: Date
}

export interface ListingResult {
  origin: ListingOrigin,
  results: CommonListing[],
  filter: Filter
}

// install Swiper modules
SwiperCore.use([Keyboard, Mousewheel]);

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent {
  linkButton!: 'Zap Imóveis' | 'Quinto Andar';

  listing!: CommonListing;

  constructor(
    private clipboard: Clipboard,
    private snack: MatSnackBar,
    private quintoService: QuintoService,
    private storageService: StorageService
  ) { }

  setListing(listing: CommonListing) {
    switch (listing.class) {
      case 'zap-listing':
        this.linkButton = 'Zap Imóveis';
        break;
      case 'quinto-listing':
        this.linkButton = 'Quinto Andar';
        if (!listing.lastPublicationDate) {
          this.quintoService.getListing(listing.originalId).subscribe(result => {
            if (result.firstPublicationDate) listing.firstPublicationDate = new Date(result.firstPublicationDate);
            if (result.lastPublicationDate) {
              listing.lastPublicationDate = new Date(result.lastPublicationDate);
              this.storageService.setLastPublicationDate(listing.id, result.lastPublicationDate);
            }
          });
        }
        break;
    }
    this.listing = listing;
  }

  getPublicationTimeInDays() {
    if (!this.listing.lastPublicationDate) return;
    const timeDifference = Date.now() - this.listing.lastPublicationDate.getTime();
    return Math.round(timeDifference / (24 * 60 * 60 * 1000));
  }

  openLink() {
    if (!this.listing) return;
    window.open(this.listing.link);
  }

  copyLink() {
    if (!this.listing) return;
    this.clipboard.copy(this.listing.link);
    this.snack.open('Link copied to clipboard', 'OK', { duration: 3000 });
  }

  getSlidesPerView() {
    const w = window.innerWidth;
    return w < 800 ? 1 : (w < 1200 ? 2 : 3);
  }

  onFavorite() {
    if (!this.listing) return;
    const newState = !this.listing.favorite;
    this.listing.favorite = newState;
    const savedFavJson = localStorage.getItem('favorites');
    const savedFav = savedFavJson ? JSON.parse(savedFavJson) as string[] : [ ];
    if (newState) {
      if (!savedFav.includes(this.listing.id)) savedFav.push(this.listing.id);
    } else {
      const index = savedFav.findIndex(id => id === this.listing.id);
      savedFav.splice(index, 1);
    }
    const toSave = JSON.stringify(savedFav);
    localStorage.setItem('favorites', toSave);
  }

  onToggleVisibility() {
    if (!this.listing) return;
    const newState = !this.listing.seen;
    this.listing.seen = newState;
    const savedSeenJson = localStorage.getItem('seen');
    const savedSeen = savedSeenJson ? JSON.parse(savedSeenJson) as string[] : [ ];
    if (newState) {
      if (!savedSeen.includes(this.listing.id)) savedSeen.push(this.listing.id);
    } else {
      const index = savedSeen.findIndex(id => id === this.listing.id);
      savedSeen.splice(index, 1);
    }
    const toSave = JSON.stringify(savedSeen);
    localStorage.setItem('seen', toSave);
  }
}
