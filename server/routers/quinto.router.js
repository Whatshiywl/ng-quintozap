const fetch = require('node-fetch');
const router = require('express').Router();

router.get('/', (req, res) => {
  const params = getParams(req.query);
  const paramsString = toQueryString(params);
  const quintoZap = 'https://www.quintoandar.com.br/api/yellow-pages/v2/search';

  fetch(`${quintoZap}?${paramsString}`, {
    "headers": {
      "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"91\", \"Chromium\";v=\"91\"",
      "sec-ch-ua-mobile": "?0",
      "x-instana-l": "1,correlationType=web;correlationId=f7714ed1e47eecf6",
      "x-instana-s": "f7714ed1e47eecf6",
      "x-instana-t": "f7714ed1e47eecf6"
    },
    "referrer": "",
    "referrerPolicy": "no-referrer",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });
});

function getParams(filter) {
  const {
    minPrice, maxPrice,
    size, from, page
  } = filter;
  return {
    'map[bounds_north]': -23,
    'map[bounds_south]': -23.01,
    'map[bounds_east]': -43.35,
    'map[bounds_west]': -43.36,
    'cost[cost_type]': 'total_cost',
    'cost[max_value]': 4600,
    'cost[min_value]': 700,
    'availability': 'any',
    'occupancy': 'any',
    'business_context': 'RENT',
    'return': 'location'
  }
}

function toQueryString(params) {
  return Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
}

router.post('/', (req, res) => {
  const body = getBody(req.body);
  const bodyString = toBodyString(body);
  const quintoZap = 'https://www.quintoandar.com.br/api/yellow-pages/v2/search';

  fetch(quintoZap, {
    "headers": {
      "accept": "application/pclick_sale.v0+json",
      "content-type": "text/plain;charset=UTF-8",
      "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"91\", \"Chromium\";v=\"91\"",
      "sec-ch-ua-mobile": "?0",
      "x-instana-l": "1,correlationType=web;correlationId=1524bb3d28b23a65",
      "x-instana-s": "1524bb3d28b23a65",
      "x-instana-t": "1524bb3d28b23a65"
    },
    "referrer": "",
    "referrerPolicy": "no-referrer",
    "body": bodyString,
    "method": "POST",
    "mode": "cors"
  })
  .then(result => result.json())
  .then(data => res.json(data))
  .catch(err => console.error(err));
});

function getBody(filter) {
  const {
    center, bounds,
    minPrice, maxPrice,
    size, from, page
  } = filter;
  const body = {
    "filters": {
      "map": {
        "bounds_north": +bounds.north,
        "bounds_south": +bounds.south,
        "bounds_east": +bounds.east,
        "bounds_west": +bounds.west,
        "center_lat": +center.lat,
        "center_lng": +center.lng
      },
      "cost": {
        "cost_type": "total_cost",
        "max_value": +maxPrice || 20000,
        "min_value": +minPrice || 200
      },
      "area": {
        "max_area": 2000,
        "min_area": 20
      },
      // "min_bedrooms": 1,
      "availability": "any",
      "occupancy": "any",
      "sorting": {
        "criteria": "relevance_rent",
        "order": "desc"
      },
      "page_size": +size || 300,
      "offset": +from || 0,
      // "search_dropdown_value": "Barra da Tijuca, Rio de Janeiro - RJ, Brasil"
    },
    "return": [
      "id",
      "coverImage",
      "rent",
      "totalCost",
      "salePrice",
      "iptuPlusCondominium",
      "area",
      "imageList",
      "imageCaptionList",
      "address",
      "regionName",
      "city",
      "visitStatus",
      "activeSpecialConditions",
      "type",
      "forRent",
      "forSale",
      "bedrooms",
      "parkingSpaces",
      "listingTags",
      "yield",
      "yieldStrategy",
      "neighbourhood",
      "location"
    ],
    "business_context": "RENT",
    "user_id": "adf064b7-0622-4077-8856-8862557980d1R"
  };
  return body;
}

function toBodyString(body) {
  return JSON.stringify(body);
  // if (typeof body === 'string') return `\\"${body}\\"`;
  // if (typeof body === 'number') return body;
  // if (typeof body === 'object') {
  //   if (Array.isArray(body)) return `[${body.join(',')}]`;
  //   else return `{${Object.keys(body).map(key => `\\"${key}\\":${toBodyString(body[key])}`).join(',')}}`;
  // }
  // const b = "{\"filters\":{\"map\":{\"bounds_north\":-22.966215755134183,\"bounds_south\":-23.03582088922476,\"bounds_east\":-43.338797983427035,\"bounds_west\":-43.37663322379111,\"center_lat\":-23.00101832217947,\"center_lng\":-43.35771560360907},\"cost\":{\"cost_type\":\"total_cost\",\"max_value\":4600,\"min_value\":700},\"area\":{\"max_area\":407,\"min_area\":30},\"min_bedrooms\":1,\"availability\":\"any\",\"occupancy\":\"any\",\"sorting\":{\"criteria\":\"relevance_rent\",\"order\":\"desc\"},\"page_size\":11,\"offset\":0,\"search_dropdown_value\":\"Barra da Tijuca, Rio de Janeiro - RJ, Brasil\"},\"return\":[\"id\",\"coverImage\",\"rent\",\"totalCost\",\"salePrice\",\"iptuPlusCondominium\",\"area\",\"imageList\",\"imageCaptionList\",\"address\",\"regionName\",\"city\",\"visitStatus\",\"activeSpecialConditions\",\"type\",\"forRent\",\"forSale\",\"bedrooms\",\"parkingSpaces\",\"listingTags\",\"yield\",\"yieldStrategy\",\"neighbourhood\"],\"business_context\":\"RENT\",\"user_id\":\"adf064b7-0622-4077-8856-8862557980d1R\"}",
}

module.exports = router;