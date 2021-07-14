import { Component } from "@angular/core";
import { QuintoHit } from "../quinto.service";
import { ZapListing } from "../zap.service";

import SwiperCore, {
  Keyboard,
  Mousewheel
} from 'swiper/core';

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

  setZapListing(listing: ZapListing) {
    this.linkButton = 'Zap Imóveis';
    this.data = {
      title: listing.listing.title,
      totalCost: listing.listing.totalCost || 0,
      area: listing.listing.area || 0,
      areaPerThousand: listing.listing.areaPerThousand || 0,
      link: listing.link.href,
      pictures: listing.listing.pictures,
      pictureCaptions: [ ],
      rooms: listing.listing.bedrooms[0]
    };
  }

  setQuintoHit(listing: QuintoHit) {
    this.linkButton = 'Quinto Andar';
    this.data = {
      title: listing._source.address,
      totalCost: listing._source.totalCost || 0,
      area: listing._source.area || 0,
      areaPerThousand: listing._source.areaPerThousand || 0,
      link: listing.link || '',
      pictures: listing._source.pictures,
      pictureCaptions: listing._source.pictureCaptions,
      rooms: listing._source.bedrooms
    };
  }

  openLink() {
    if (!this.data) return;
    window.open(this.data.link);
  }
}
