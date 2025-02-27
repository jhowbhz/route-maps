<div align="center">Obtain the distance and time between two addresses in Brazil.</div>

## Installation
````bash 
npm i route-maps
````
## How to use
````javascript
import getRoute from 'route-maps';

const ceps = ['04336000', '04335000'];
const response = await getRoute(ceps);

console.log(response);

````
### Response 
````javascript
{
    "ok": true,
    "distanceRaw": 443836,
    "distance": "444 km",
    "timeRaw": 21260,
    "time": "5 h 54 min",
    "extra": {
        "timeInfo": {
            "distancia": "444 km",
            "tempo": "5 h 54 min",
            "medida": "km",
            "unidade_tempo": "h",
            "unidade_distancia": "min",
        },
        "coordsInfo": {
            "origin": {
                "lat": -23.552504499999998,
                "lng": -46.634962099999996
            },
            "destination": {
                "lat": -22.4493306,
                "lng": -43.177078699999996
            }
        },
        "tollsInfo": "Esta rota contém pedágios."
    },
    "info": [
        {
            "cep": "01001-000",
            "logradouro": "Praça da Sé",
            "complemento": "lado ímpar",
            "unidade": "",
            "bairro": "Sé",
            "localidade": "São Paulo",
            "uf": "SP",
            "estado": "São Paulo",
            "regiao": "Sudeste",
            "ibge": "3550308",
            "gia": "1004",
            "ddd": "11",
            "siafi": "7107"
        },
        {
            "cep": "20040-020",
            "logradouro": "Praça Pio X",
            "complemento": "lado ímpar",
            "unidade": "",
            "bairro": "Centro",
            "localidade": "Rio de Janeiro",
            "uf": "RJ",
            "estado": "Rio de Janeiro",
            "regiao": "Sudeste",
            "ibge": "3304557",
            "gia": "",
            "ddd": "21",
            "siafi": "6001"
        }
    ]
}
````

#### Créditos

Esse pacote, foi inspirado nesse repositório.
https://www.npmjs.com/package/get-route