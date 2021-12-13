// node_modules
const colors = require('colors');
const NodeCouchDb = require('node-couchdb');  

// config
const { servers, auth, user, pass } = require('./config.json');


// contains couchDB connection for every host
let couchConnections = {};

async function run() 
{
    await createCouchConnections();

    for (let con in couchConnections) {
        let hostname = con;
        clearDatabase(couchConnections[con], hostname)
    }
}

run();


// **************************************************
//      create couchdb instance for every host
// **************************************************

async function createCouchConnections()
{
    for (let host in servers) 
    {
        let hostname = host;
        let serverIP = servers[host].ip;
        let couchDB_port = servers[host].couchDB_port;
    
    
        let connectionOptions = {
            host: serverIP,
            port: couchDB_port,
            protocol: 'http'
        }
    
        // add username and password, if authorizaion is enabled for hosts
        if (auth) {
            connectionOptions.auth = { user, pass }
        }
    
    
        // **************************************************
        //              check host availability
        // **************************************************
    
        let couchConnection = new NodeCouchDb(connectionOptions);
    
        await couchConnection.listDatabases()
        .then(dbs => {
            couchConnections[hostname] = couchConnection;
            console.log(colors.blue(`* Connected to couchDB of ${hostname} - ${serverIP} `));
        }, 
        err => {
            if (err.code === "ECONNREFUSED") {
                console.log(colors.bgRed(`\n${hostname} [${serverIP}] is NOT available.`));
            }
            console.log(colors.red(err) + "\n");
        }); 
    }
}


// **************************************************
//              clear the databases
// **************************************************

function clearDatabase(couchConnection, hostname) 
{
    const dbName = "mychannel_fabcar";

    const mangoQuery = {
        selector: {
            docType: 'car'
            // _id: 'bash_car_1',
            // $gte: {speed: '199'},
            // $lt: {firstname: 'George'},
        },
        limit: +process.argv[2] || 1000
    };

    const parameters = {};


    console.log(colors.yellow(`\n**********************************************`));
    console.log(colors.yellow(`          Cleaning started for ${hostname}`));
    console.log(colors.yellow(`**********************************************\n`));
     

    couchConnection.mango(dbName, mangoQuery, parameters).then(({data, headers, status}) => 
    {
        let docs = data.docs;
        let docs_num = +docs.length;

        if (!docs_num) {
            console.log(colors.bgBlue.black(`${hostname} couchDB is empty.\n`));
        }

        else
        {
            docs.forEach((doc, index) => 
            {
                couchConnection.del(dbName, doc._id, doc._rev)
                .then(({data, headers, status}) => 
                {
                    console.log(colors.green(`Total length: ${docs_num} - Doc ${index+1} deleted.`));
                    
                    if (index === docs_num-1) {
                        console.log(colors.bgGreen.black(`${hostname} couchDB cleaned`));
                    }
                }, 
                
                err => {
                    console.log(colors.red(err));
                });
            });
        }    
    }, 
    err => {
        // ...or err.code=EDOCMISSING if document is missing
        // ...or err.code=EUNKNOWN if statusCode is unexpected
        console.log(colors.bgRed(`Error in getting the docs of ${hostname}`));
        console.log(colors.red(err));
    });
}




// couchDB.get("mychannel_fabcar", "bash_car_2").then(({data, headers, status}) => 
// {
//     console.log(data);
// }, err => {
//     // err.code=EDOCMISSING if document is missing
//     // err.code=EUNKNOWN if statusCode is unexpected
//     console.log(err);
// });
