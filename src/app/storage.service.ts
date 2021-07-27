import { Injectable } from "@angular/core";

@Injectable()
export class StorageService {

  getLastPublicationDates() {
    return this.getJSON('lastPublications') || { };
  }

  getLastPublicationDate(id: string) {
    const dates = this.getLastPublicationDates()
    return dates[id];
  }

  setLastPublicationDate(id: string, date: string) {
    const dates = this.getLastPublicationDates();
    dates[id] = date;
    this.setJSON('lastPublications', dates);
  }

  private getJSON(key: string) {
    const obj = localStorage.getItem(key);
    if (!obj) return;
    return JSON.parse(obj);
  }

  private setJSON(key: string, value: object) {
    const obj = JSON.stringify(value);
    localStorage.setItem(key, obj);
  }

}
