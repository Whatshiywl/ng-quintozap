import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { interval } from "rxjs";
import { map, mergeMap, switchMap, takeWhile, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { Filter } from "./app.component";

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
  whatsappNumber: string,
  totalCost?: number,
  area?: number,
  areaPerThousand: number
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

  constructor(private client: HttpClient) { }

  getZap(zapFilter: Filter) {
    const tempFilter = { ...zapFilter };
    tempFilter.size = tempFilter.size || 300;
    return interval(500)
    .pipe(
      mergeMap(i => {
        tempFilter.page = i + 1;
        return this.getFromApi(tempFilter)
        .pipe(map(results => ({ results, i })));
      }),
      takeWhile(({ results, i }) => {
        const resultSize = results.length;
        const fullResults = resultSize === tempFilter.size;
        const belowRetryLimit = i < 5;
        return fullResults && belowRetryLimit;
      }, true),
      map(({ results }) => {
        const filtered = results
        .filter(el => el.listing.address.point);
        filtered.forEach(el => {
          el.accountLink.href = `https://www.zapimoveis.com.br${el.accountLink.href}`;
          el.link.href = `https://www.zapimoveis.com.br${el.link.href}`;
          if (el.listing.address.point) {
            el.listing.address.mapPosition = {
              lat: el.listing.address.point.lat,
              lng: el.listing.address.point.lon
            };
          }
          el.listing.totalCost = this.getFullListingPrice(el);
          el.listing.area = +el.listing.totalAreas[0] || +el.listing.usableAreas[0];
          el.listing.areaPerThousand = Math.round(el.listing.area * 1000 / el.listing.totalCost);
        });
        return filtered;
      }),
      takeWhile(results => {
        const noResult = results.length === 0;
        return noResult;
      }, true)
    );
  }

  private getFromApi(zapFilter: Filter) {
    const path = `${location.origin}${this.zapApi}`;
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
    const { minPrice, maxPrice, size, page } = filter;
    if (minPrice) params = params.append('minPrice', `${minPrice}`);
    if (maxPrice) params = params.append('maxPrice', `${maxPrice}`);
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
}
