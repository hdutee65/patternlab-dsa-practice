self.postMessage({ready:true});

self.onmessage = async ({data}) => {
  const {runId, testCase, index, code} = data;
  try {
    const execute = new Function('data', `"use strict";\n${code}\nif (typeof solve !== "function") throw new TypeError("Define solve(data) and return one JSON-compatible value");\nreturn solve(data);`);
    const value = await execute(testCase.input);
    const json = JSON.stringify(value);
    if (json === undefined) throw new TypeError('solve(data) must return a JSON-compatible value');
    self.postMessage({runId,index,actual:json});
  } catch (error) {
    self.postMessage({runId,index,error:String(error).split('\n').slice(-1)[0]});
  }
};
