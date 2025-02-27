const axios = require('axios').default;
const { isArrayOfCEPs, isModeValid, isValidIndexes } = require('./validate.js');
const { cleanCeps, getIndicesOf } = require('./utils.js');
const errors = require('./errors.js');

const extractRoute = (data, identifier) => {

  const [, index] = getIndicesOf(`cep ${identifier}`, data, true);
  if (index === -1) {
    throw new Error('Identificador não encontrado nos dados.');
  }

  const rawString = data.substring(index, index + 1000).replace(/\\|\//g, '');
  const start = rawString.indexOf('[[');
  const end = rawString.lastIndexOf(']]') + 2;

  if (!isValidIndexes(start, end)) {
    throw new Error(`Formato de dados inválido. Índices: start=${start}, end=${end}`);
  }

  try {

    let extractedJson = rawString.substring(start, end);

    extractedJson = extractedJson
      .replace(/,(\s*[\}\]])/g, '$1')
      .replace(/,\s*\]/g, ']')
      .replace(/,\s*\}/g, '}');

    const balanceBrackets = (str) => {
      const openCount = (str.match(/\[/g) || []).length;
      const closeCount = (str.match(/\]/g) || []).length;
      const missing = openCount - closeCount;
      return missing > 0 ? str + ']'.repeat(missing) : str;
    };

    extractedJson = balanceBrackets(extractedJson);
    const parsedData = JSON.parse(extractedJson);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error('Dados parseados estão vazios.');
    }

    const firstElement = parsedData[0];
    if (!Array.isArray(firstElement) || firstElement.length === 0) {
      throw new Error('Primeiro elemento dos dados parseados está vazio.');
    }

    const routeData = firstElement[0];
    if (!Array.isArray(routeData) || routeData.length < 10) {
      throw new Error('Dados da rota não possuem o formato esperado.');
    }

    const distanceData = routeData[2]; // Ex: [443835, "444 km", 0]
    const timeData = routeData[3];     // Ex: [21258, "5 h 54 min"]

    // Extração de coordenadas
    const coordsData = routeData[7];
    let coordsInfo = {};
    if (Array.isArray(coordsData) && coordsData.length >= 4) {
      const coordsContainer = coordsData[3];
      if (Array.isArray(coordsContainer) && coordsContainer.length >= 4) {
        const originCoords = coordsContainer[2];
        const destinationCoords = coordsContainer[3];

        if (Array.isArray(originCoords) && originCoords.length >= 4) {
          coordsInfo.origin = {
            lat: originCoords[2],
            lng: originCoords[3]
          };
        }

        if (Array.isArray(destinationCoords) && destinationCoords.length >= 4) {
          coordsInfo.destination = {
            lat: destinationCoords[2],
            lng: destinationCoords[3]
          };
        }
      }
    }

    // Informações de tempo e distância
    let timeInfo = {
      distancia: distanceData[1],
      tempo: timeData[1],
      medida: 'km',
      unidade_tempo: 'h',
      unidade_distancia: 'min'
    };

    // Extração de pedágios
    const advisoryData = routeData[9];
    let tollsInfo = "Esta rota não contém pedágios.";
    if (Array.isArray(advisoryData)) {
      const tollAdvisory = advisoryData.find(item => item && item[1] === "Trajeto com pedágios");
      if (tollAdvisory) {
        tollsInfo = "Esta rota contém pedágios.";
      }
    }

    return {
      distanceRaw: distanceData[0],
      distance: distanceData[1],
      timeRaw: timeData[0],
      time: timeData[1],
      extra: {
        timeInfo,
        coordsInfo,
        tollsInfo
      }
    };

  } catch (error) {
    
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      fs.writeFileSync('error_data.txt', rawString);
    }
  
    throw new Error(error.message || 'Falha ao processar os dados.');
  
  }

};

const convertCepsToParameter = cepsArray =>

  cepsArray.map(cep => `cep+${cep}`).join('/');

  const convertTravelModeToParameter = mode => {
    const travelModes = {
      driving: 'data=!4m2!4m1!3e0',
      walking: 'data=!4m2!4m1!3e2',
    };
    return travelModes[mode];
  };

  const convertToParams = (cepsArray, travelMode) => {
    
    const cepsParameter = convertCepsToParameter(cepsArray);
    const travelModeAsParams = convertTravelModeToParameter(travelMode);
    return { ceps: cepsParameter, travelMode: travelModeAsParams };

  };

  const generateRoute = (ceps, mode) => {
    
    const params = convertToParams(ceps, mode);
    const identifier = ceps.at(-1);
    return {
      extract: data => extractRoute(data, identifier),
      URL: `https://www.google.com.br/maps/dir/${params.ceps}/${params.travelMode}`,
    };
  
  };

  const getRoute = async (ceps, mode = 'driving') => {

    try {

      if (!isArrayOfCEPs(ceps)) {
        throw new Error(errors.invalidCeps);
      }
      if (!isModeValid(mode)) {
        throw new Error(errors.invalidMode);
      }

      const route = generateRoute(cleanCeps(ceps), mode);

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
        'Accept-Language': 'pt-BR,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Host': 'www.google.com',
        'Referer': 'https://www.google.com/',
      };

      const { data } = await axios.get(route.URL, { headers });

      return { ok: true, ...route.extract(data) };

    } catch (error) {
      const isKnownError = Object.values(errors).includes(error.message);
      console.error(isKnownError ? error.message : errors.default);
      return { ok: false, error: error.message || errors.default };
    }

};

module.exports = getRoute;