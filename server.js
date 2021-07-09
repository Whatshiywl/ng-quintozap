const fs = require('fs');
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const path = require('path');
const fetch = require('node-fetch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use('/', express.static(path.join(__dirname, 'dist', 'ng-quintozap')));

app.get('/api/googlemapsapikey', (_, res) => {
  res.send(process.env.MAPS_API_KEY || '');
});

app.get('/api/zap', (req, res) => {
  const { lat, lng } = req.query;
  const params = getParams(lat, lng);
  const paramsString = toQueryString(params);
  const zapPath = 'https://glue-api.zapimoveis.com.br/v2/listings';

  fetch(`${zapPath}?${paramsString}`, {
    "headers": getHeaders(),
    "referrer": "https://www.zapimoveis.com.br/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  })
  .then(result => result.json())
  .then(data => res.json(data))
  .catch(err => console.error(err));
});

app.listen(port, () => console.log(`Express listening to port ${port}`));

// End express setup

function getParams(lat, lng) {
  const fields = getIncludeFields();
  return {
    unitSubTypes: 'UnitSubType_NONE,DUPLEX,TRIPLEX',
    unitTypes: 'APARTMENT',
    unitTypesV3: 'APARTMENT',
    usageTypes: 'RESIDENTIAL',
    text: 'Apartamento',
    categoryPage: 'RESULT',
    business: 'RENTAL',
    listingType: 'USED',
    portal: 'ZAP',
    size: '300',
    from: '0',
    page: '1',
    cityWiseStreet: '1',
    developmentsSize: '3',
    superPremiumSize: '0',
    addressCountry: '',
    addressState: 'Rio de Janeiro',
    addressCity: 'Rio de Janeiro',
    addressZone: '',
    addressNeighborhood: '',
    addressStreet: '',
    addressAccounts: '',
    addressType: 'city',
    addressLocationId: 'BR>Rio de Janeiro>NULL>Rio de Janeiro',
    addressPointLat: `${lat}`,
    addressPointLon: `${lng}`,
    __zt: 'smt:a,mtc:ipl',
    includeFields: fieldsToString(fields)
  };
}

function getHeaders() {
  return {
    "accept": "application/json, text/plain, */*",
    "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,fr;q=0.5,es;q=0.4",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"91\", \"Chromium\";v=\"91\"",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "x-domain": "www.zapimoveis.com.br"
  };
}

function fieldsToString(fields) {
  return fields.map(field => {
    if (typeof field === 'string') return field;
    const inner = fieldsToString(field.value);
    return `${field.key}(${inner})`;
  }).join(',');
}

function getIncludeFields() {
  return [
    { key: 'search', value: getSearchFields() },
    { key: 'expansion', value: [{ key: 'search', value: getSearchFields() }] },
    { key: 'nearby', value: [{ key: 'search', value: getSearchFields() }] },
    'page',
    'fullUriFragments',
    { key: 'developments', value: [{ key: 'search', value: getSearchFields() }] },
    { key: 'superPremium', value: [{ key: 'search', value: getSearchFields() }] },
    { key: 'owners', value: [{ key: 'search', value: getSearchFields() }] }
  ];
}

function getSearchFields() {
  return [
    {
      key: 'result',
      value: [
        { key: 'listings', value: getElementFields() }
      ]
    },
    'totalCount'
  ];
}

function getElementFields() {
  return [
    { key: 'listing', value: getListingFields() },
    { key: 'account', value: getAccountFields() },
    'medias',
    'accountLink',
    'link'
  ];
}

function getListingFields() {
  return [
    'displayAddressType',
    'amenities',
    'usableAreas',
    'constructionStatus',
    'listingType',
    'description',
    'title',
    'stamps',
    'createdAt',
    'floors',
    'unitTypes',
    'nonActivationReason',
    'providerId',
    'propertyType',
    'unitSubTypes',
    'unitsOnTheFloor',
    'legacyId',
    'id',
    'portal',
    'unitFloor',
    'parkingSpaces',
    'updatedAt',
    'address',
    'suites',
    'publicationType',
    'externalId',
    'bathrooms',
    'usageTypes',
    'totalAreas',
    'advertiserId',
    'advertiserContact',
    'whatsappNumber',
    'bedrooms',
    'acceptExchange',
    'pricingInfos',
    'showPrice',
    'resale',
    'buildings',
    'capacityLimit',
    'status'
  ];
}

function getAccountFields() {
  return [
    'id',
    'name',
    'logoUrl',
    'licenseNumber',
    'showAddress',
    'legacyVivarealId',
    'legacyZapId',
    'minisite'
  ];
}

function toQueryString(params) {
  return Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
}
