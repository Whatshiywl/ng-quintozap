import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";

export interface ZapAddress {
  city: string,
  neighborhood: string,
  state: string,
  street: string,
  streetNumber?: string,
  zone: string
}

export interface ZapLink {
  data: ZapAddress,
  href: string,
  name: string,
  rel: string
}

export interface ZapListingMetadata {
  acceptExchange: boolean,
  address: ZapAddress & {
    compliment: string,
    confidence: string,
    country: string,
    district: string,
    geoJson: string,
    ibgeCityId: string,
    level: string,
    locationId: string,
    name: string,
    point?: { lat: number, lon: number, source: string },
    mapPosition?: google.maps.LatLngLiteral,
    pois: any[],
    poisList: string[],
    precision: string,
    source: string,
    stateAcronym: string,
    valuableZones: any[],
    zipCode: string,
  },
  advertisersContact: { phones: string[], advertiserId: string },
  amenities: string[],
  bathrooms: number[],
  bedrooms: number[],
  buildings: number,
  capacityLimit: any[],
  constructionStatus: string,
  createdAt: Date,
  description: string,
  displayAddressType: string,
  externalId: string,
  floors: any[],
  id: string,
  legacyId: string,
  listingType: string,
  nonActiveReason: string,
  parkingSpaces: string[],
  portal: string,
  pricingInfos: {
    businessType: string,
    monthlyCondoFee: string,
    price: string,
    rentalInfo: {
      monthlyRentalTotalPrice: string,
      period: string,
      warranties: any[]
    },
    yearlyIptu: string
  }[],
  propertyType: string,
  providerId: string,
  publicationType: string,
  resale: boolean,
  showPrice: boolean,
  stamps: any[],
  status: string,
  suites: number[],
  title: string,
  totalAreas: string[],
  unitFloor: number,
  unitTypes: string[],
  unitsOnTheFloor: number,
  updatedAt: Date,
  usableAreas: string[],
  usageTypes: string[],
  whatsappNumber: string
}

export interface ZapListing {
  account: {
    id: string,
    legacyVivarealId: number,
    legacyZapId: number,
    licenseNumber: string,
    logoUrl: string,
    name: string,
    showAddress: boolean
  },
  accountLink: ZapLink,
  link: ZapLink,
  listing: ZapListingMetadata,
  medias: {
    type: string,
    url: string
  }[]
}

@Injectable()
export class ZapService {
  private zapApi = `${environment.apiPrefix}/api/zap`;

  constructor(private client: HttpClient) {
    console.log(environment);
  }

  getZap(center: google.maps.LatLngLiteral) {
    const path = `${location.origin}${this.zapApi}`;
    return this.client.get<{
      search: {
        result: { listings: ZapListing[], totalCount: number }
      }
    }>(path, {
      params: this.getParams(center)
    }).pipe(
      map(data => {
        const listings = data.search.result.listings;
        listings.forEach(el => {
          el.accountLink.href = `https://www.zapimoveis.com.br${el.accountLink.href}`;
          el.link.href = `https://www.zapimoveis.com.br${el.link.href}`;
          if (el.listing.address.point) {
            el.listing.address.mapPosition = {
              lat: el.listing.address.point.lat,
              lng: el.listing.address.point.lon
            };
          }
        });
        return listings;
      })
    );
  }

  private getParams(center: google.maps.LatLngLiteral) {
    return new HttpParams()
    .append('lat', `${center.lat}`)
    .append('lng', `${center.lng}`);
  }

}
