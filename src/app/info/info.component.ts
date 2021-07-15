import { Component } from "@angular/core";
import { QuintoHit } from "../quinto.service";
import { ZapListing } from "../zap.service";
import { Clipboard } from "@angular/cdk/clipboard";

import SwiperCore, {
  Keyboard,
  Mousewheel
} from 'swiper/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { Filter } from "../app.component";

export type ListingOrigin = 'zap' | 'quinto';

export interface CommonListing {
  class: 'zap-listing' | 'quinto-listing',
  origin: ListingOrigin,
  id: string,
  title: string,
  totalCost: number
  area: number,
  areaPerThousand: number,
  link: string,
  pictures: string[],
  pictureCaptions: string[],
  rooms: number,
  mapPosition: google.maps.LatLngLiteral
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
  zapListing!: ZapListing;
  quintoHit!: QuintoHit;
  linkButton!: 'Zap Imóveis' | 'Quinto Andar';

  data?: {
    title: string,
    totalCost: number
    area: number,
    areaPerThousand: number,
    link: string,
    pictures: string[],
    pictureCaptions: string[],
    rooms: number
  };

  constructor(
    private clipboard: Clipboard,
    private snack: MatSnackBar
  ) { }

  setZapListing(listing: CommonListing) {
    this.linkButton = 'Zap Imóveis';
    this.data = listing;
  }

  setQuintoHit(listing: CommonListing) {
    this.linkButton = 'Quinto Andar';
    this.data = listing;
  }

  setListing(listing: CommonListing) {
    switch (listing.class) {
      case 'zap-listing':
        this.linkButton = 'Zap Imóveis';
        break;
      case 'quinto-listing':
        this.linkButton = 'Quinto Andar';
        break;
    }
    this.data = listing;
  }

  openLink() {
    if (!this.data) return;
    window.open(this.data.link);
  }

  copyLink() {
    if (!this.data) return;
    this.clipboard.copy(this.data.link);
    this.snack.open('Link copied to clipboard', 'OK', { duration: 3000 });
  }

  getSlidesPerView() {
    const w = window.innerWidth;
    return w < 800 ? 1 : (w < 1200 ? 2 : 3);
  }
}
