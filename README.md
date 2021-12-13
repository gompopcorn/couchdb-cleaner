# clears the couchdb of every host included in the config.json file


```
// node app.js $numofDocs to clean from each host
// $numofDocs is optional - default is 1000

node app.js          // removes 1000 docs from each host
node app.js 500     // removes 500 docs from each host
```