import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { first, map, takeWhile } from "rxjs/operators";
import { Filter } from "./app.component";
import { CommonListing, ListingOrigin, ListingResult } from "./info/info.component";
import { StorageService } from "./storage.service";

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
    point: { lat: number, lon: number, source: string },
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
  createdAt: string,
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
  updatedAt: string,
  usableAreas: string[],
  usageTypes: string[],
  whatsappNumber: string,
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
  private zapApi = `api/zap`;
  readonly listings$: Subject<ListingResult> = new Subject<ListingResult>();
  private origin: ListingOrigin = 'zap';

  constructor(
    private client: HttpClient,
    private storageService: StorageService
  ) { }

  filter(zapFilter: Filter) {
    const obs = this.getListings(zapFilter);
    obs.pipe(first())
    .subscribe(results => this.listings$.next(results));
    return obs;
  }

  getListings(zapFilter: Filter) {
    const tempFilter = { ...zapFilter };
    tempFilter.size = tempFilter.size || 100;
    return this.getFromApi(zapFilter)
    .pipe(
      takeWhile(results => {
        const resultSize = results.length;
        const fullResults = resultSize === tempFilter.size;
        return fullResults;
      }, true),
      map(results => {
        return results.filter(el => el.listing.address.point);
      }),
      takeWhile(results => {
        const noResult = results.length === 0;
        return noResult;
      }, true),
      map(results => {
        return {
          origin: this.origin,
          results: this.toCommonListings(results),
          filter: zapFilter
        } as ListingResult;
      })
    );
  }

  private getFromApi(zapFilter: Filter) {
    const path = `${this.zapApi}`;
    return this.client.get<{
      search: {
        result: { listings: ZapListing[], totalCount: number }
      }
    }>(path, {
      params: this.getParams(zapFilter)
    })
    .pipe(
      map(data => {
        return data.search.result.listings;
      })
    );
  }

  private getParams(filter: Filter) {
    let params = new HttpParams()
    if (filter.mapParams?.bounds) {
      const { bounds: { east, west, north, south } } = filter.mapParams;
      const viewport = `${east},${north}|${west},${south}`;
      params = params.append('viewport', viewport);
    }
    const { minPrice, maxPrice, maxArea, minArea, size, page } = filter;
    if (minPrice) params = params.append('minPrice', `${minPrice}`);
    if (maxPrice) params = params.append('maxPrice', `${maxPrice}`);
    if (minArea) params = params.append('minArea', `${minArea}`);
    if (maxArea) params = params.append('maxArea', `${maxArea}`);
    if (size) params = params.append('size', size);
    if (page) {
      params = params.append('page', page);
      if (size) params = params.append('from', (page - 1) * size);
    }
    return params;
  }

  private getFullListingPrice(listing: ZapListing) {
    const pricing = listing.listing.pricingInfos.find(info => info.businessType === 'RENTAL');
    if (!pricing) return 0;
    const rent = (+pricing.price || 0) + (+pricing.monthlyCondoFee || 0);
    return Math.round(rent);
  }

  private toCommonListings(results: ZapListing[]) {
    return results.map(result => {
      const id = `${this.origin}-${result.listing.id}`;
      const area = +result.listing.usableAreas[0];
      const totalCost = this.getFullListingPrice(result);
      const areaPerThousand = Math.round(area * 1000 / totalCost);
      const pictures = result.medias
      .filter(media => media.type === 'IMAGE')
      .map(media => {
        return media.url
        .replace('{action}', 'fit-in')
        .replace('{width}', '800')
        .replace('{height}', '360');
      });
      const mapped: CommonListing = {
        class: 'zap-listing',
        origin: this.origin,
        id,
        originalId: result.listing.id,
        title: result.listing.title,
        totalCost,
        area,
        areaPerThousand,
        link: `https://www.zapimoveis.com.br${result.link.href}`,
        pictures,
        pictureCaptions: [ ],
        rooms: result.listing.bedrooms[0],
        mapPosition: {
          lat: result.listing.address.point.lat,
          lng: result.listing.address.point.lon
        },
        firstPublicationDate: new Date(result.listing.createdAt),
        lastPublicationDate: new Date(result.listing.updatedAt)
      };
      return mapped;
    });
  }
}
