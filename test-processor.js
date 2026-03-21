// Artillery Test Processor
// =========================

module.exports = {
  // Before each request
  requestParams: (requestParams, context, ee, next) => {
    // Add common headers
    requestParams.headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Supermarket-Go-Performance-Test/1.0',
      'X-Test-Run': Date.now().toString(),
      ...requestParams.headers
    };
    
    return next(null, requestParams);
  },

  // After each response
  response: (requestParams, response, context, ee, next) => {
    // Log response time
    if (response && response.request && response.request.metrics) {
      const responseTime = response.request.metrics.responseTime;
      console.log(`Response time: ${responseTime}ms for ${requestParams.url}`);
    }
    
    return next(null, response);
  }
};
