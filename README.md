- Run `yarn`
- From [this thread](https://github.com/serverless/serverless/issues/10944), open up `node_modules/serverless/bin/serverless.js` in your global node_modules and add this right after use strict;:

  ```
  require('../../graceful-fs/graceful-fs').gracefulify(require('fs'));
  ```
