import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { first, map, takeWhile } from "rxjs/operators";
import { Filter } from "./app.component";
import { CommonListing, ListingOrigin, ListingResult } from "./info/info.component";
import { StorageService } from "./storage.service";

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
  private quintoApi = `api/quinto`;
  readonly listings$: Subject<ListingResult> = new Subject<ListingResult>();
  private origin: ListingOrigin = 'quinto'

  constructor(
    private client: HttpClient,
    private storageService: StorageService
  ) { }

  filter(quintoFilter: Filter) {
    const obs = this.getListings(quintoFilter);
    obs.pipe(first())
    .subscribe(results => this.listings$.next(results));
    return obs;
  }

  getListings(quintoFilter: Filter) {
    const tempFilter = { ...quintoFilter };
    tempFilter.size = tempFilter.size || 100;
    return this.getFromApi(quintoFilter)
    .pipe(
      takeWhile(results => {
        const resultSize = results.length;
        const fullResults = resultSize === tempFilter.size;
        return fullResults;
      }, true),
      takeWhile(results => {
        const noResult = results.length === 0;
        return noResult;
      }, true),
      map(results => {
        return {
          origin: this.origin,
          results: this.toCommonListings(results),
          filter: quintoFilter
        } as ListingResult;
      })
    );
  }

  getListing(id: string) {
    const path = `${this.quintoApi}/${id}`;
    return this.client.get<{
      firstPublicationDate: string,
      lastPublicationDate: string
    }>(path)
    .pipe(
      first()
    );
  }

  private getFromApi(quintoFilter: Filter) {
    const path = `${this.quintoApi}`;
    return this.client.post<QuintoResult>(path, this.getBody(quintoFilter))
    .pipe(
      map(data => {
        return data.hits.hits;
      })
    );
  }

  private getBody(filter: Filter) {
    const { minPrice, maxPrice, maxArea, minArea, rooms, size, page } = filter;
    const from = size && page ? (page - 1) * size : 0;
    const body = {
      ...(filter.mapParams || { }),
      minPrice,
      maxPrice,
      maxArea,
      minArea,
      rooms,
      size,
      page,
      from
    };
    return body;
  }

  private toCommonListings(results: QuintoHit[]) {
    const lastPublicationDates = this.storageService.getLastPublicationDates();
    return results.map(result => {
      const id = `${this.origin}-${result._id}`;
      const areaPerThousand = Math.round(result._source.area * 1000 / result._source.totalCost);
      const pictures = result._source.imageList
      .map(image => {
        return `https://www.quintoandar.com.br/img/xxl/${image}`;
      });
      const pictureCaptions = [ ...result._source.imageCaptionList ];
      const mapped: CommonListing = {
        class: 'quinto-listing',
        origin: this.origin,
        id,
        originalId: result._id,
        title: result._source.address,
        totalCost: result._source.totalCost,
        area: result._source.area,
        areaPerThousand,
        link: `https://www.quintoandar.com.br/imovel/${result._id}`,
        pictures,
        pictureCaptions,
        rooms: result._source.bedrooms,
        mapPosition: {
          lat: result._source.location.lat,
          lng: result._source.location.lon
        },
        lastPublicationDate: lastPublicationDates[id] ? new Date(lastPublicationDates[id]) : undefined
      };
      return mapped;
    });
  }

}
