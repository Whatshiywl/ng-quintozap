import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { interval } from "rxjs";
import { map, mergeMap, switchMap, takeWhile, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { Filter } from "./app.component";

export interface QuintoHitMetadata {
  activeSpecialConditions: any,
  address: string,
  area: number,
  bedrooms: number,
  city: string,
  coverImage: string,
  forRent: boolean,
  forSale: boolean,
  id: number,
  imageCaptionList: string[],
  imageList: string[],
  iptuPlusCondominium: number,
  neighbourhood: string,
  parkingSpaces: number,
  regionName: string,
  rent: number,
  salePrice: number,
  totalCost: number,
  type: string,
  visitStatus: string,
  location: {
    lat: number,
    lon: number
  }
  mapPosition?: google.maps.LatLngLiteral
}

export interface QuintoHit {
  _id: string,
  _index: string,
  _score: number,
  _source: QuintoHitMetadata,
  _type: string,
  link?: string
}

export interface QuintoHits {
  hits: QuintoHit[],
  max_score: number,
  total: {
    value: number,
    relation: string
  }
}

export interface QuintoResult {
  hits: QuintoHits,
  search_id: string,
  timed_out: boolean,
  took: number,
  _shards: {
    total: number,
    successful: number,
    skipped: number,
    failed: number
  }
}

@Injectable()
export class QuintoService {
  private quintoApi = `${environment.apiPrefix}/api/quinto`;

  constructor(private client: HttpClient) { }

  getZap(quintoFilter: Filter) {
    const tempFilter = { ...quintoFilter };
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
        // const filtered = results
        // .filter(el => el.listing.address.point);
        results.forEach(el => {
          el.link = `https://www.quintoandar.com.br/imovel/${el._id}`;
          el._source.mapPosition = {
            lat: el._source.location.lat,
            lng: el._source.location.lon
          };
          // el.accountLink.href = `https://www.zapimoveis.com.br${el.accountLink.href}`;
          // el.link.href = `https://www.zapimoveis.com.br${el.link.href}`;
          // if (el.listing.address.point) {
          //   el.listing.address.mapPosition = {
          //     lat: el.listing.address.point.lat,
          //     lng: el.listing.address.point.lon
          //   };
          // }
          // el.listing.fullRentalPrice = this.getFullListingPrice(el);
        });
        return results;
      }),
      takeWhile(results => {
        const noResult = results.length === 0;
        return noResult;
      }, true)
    );
  }

  private getFromApi(quintoFilter: Filter) {
    const path = `${location.origin}${this.quintoApi}`;
    return this.client.post<QuintoResult>(path, this.getBody(quintoFilter))
    .pipe(
      map(data => {
        return data.hits.hits;
      })
    );
  }

  private getBody(filter: Filter) {
    const { minPrice, maxPrice, size, page } = filter;
    const from = size && page ? (page - 1) * size : 0;
    const body = {
      ...(filter.mapParams || { }),
      minPrice,
      maxPrice,
      size,
      page,
      from
    };
    return body;
  }

}
