const { runE2E } = require('./e2e_test');

(async () => {
  const result = await runE2E();
  console.log(JSON.stringify(result, null, 2));
})();
