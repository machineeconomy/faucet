var app = require('express')();
var https = require('https');

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/akita.einfach-iota.de/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/akita.einfach-iota.de/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/akita.einfach-iota.de/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

var cors = require('cors')
app.use(cors())

const httpsServer = https.createServer(credentials, app);

var core = require('@iota/core');
var validator = require('@iota/validators');
var iota = core.composeAPI({
    provider: 'https://nodes.devnet.thetangle.org:443'
})

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT
const SEED = process.env.SEED

// datavase settings
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)


if (!db.get('keyIndex').value()) {
    // setup database
    db.set('keyIndex', 0)
        .write()
}

var payoutamount = 1

app.get('/', (req, res) => {res.send(`Welcome to the AKITA IOTA Devnet Faucet!`)})

app.post('/send_tokens', function (request, response) {
    if (request.query.hasOwnProperty('address')) {
        let payoutaddress = request.query.address
        // check if address is a valid IOTA address
        // TODO: CHECK WHY THIS iS NOt WOrkinG: if (payoutaddress.length >= 81 && validator.isAddress(payoutaddress)) {
        if (payoutaddress.length >= 81) {
            // send iotas to the address
            sendIotas(payoutaddress, db.get('keyIndex').value())
            response.json({ status: "ok", address: payoutaddress, message: "Sent IOTA Tokens to the given address.", url: `https://devnet.thetangle.org/address/${payoutaddress}`});

        } else {
            response.json({ status: "error", message: "Invalid IOTA address." });
        }

    } else {
        response.json({ status: "error", message: "'address' not in the query." });
    }
})

async function sendIotas(payoutaddress, keyIndex) {
    let inputAddress = core.generateAddress(SEED, keyIndex, 2)
    let balance = await iota.getBalances([inputAddress], 100)
    balance = balance.balances[0]
    if (balance < payoutamount) {
        console.log('Not enough iotas');
        return
    }
    let transfers = [
        //payout
        {
            value: payoutamount,
            address: payoutaddress
        },
        //remaining iotas
        {
            value: balance - payoutamount,
            address: core.generateAddress(SEED, keyIndex + 1, 2)
        }]
    let options = {
        'inputs': [{
            address: inputAddress,
            keyIndex: keyIndex,
            balance: balance,
            security: 2,
        }]
    }
    iota
        .prepareTransfers(SEED, transfers, options)
        .then(trytes => iota.sendTrytes(trytes, 3, 9))
        .then(bundle => {
            console.log('Transfer sent: https://devnet.thetangle.org/transaction/' + bundle[0].hash)
            // update key index and save it
            let new_key_index = keyIndex + 1;
            db.set('keyIndex', new_key_index)
                .write()            
        })
        .catch(err => {
            console.log(err)
        })
}


httpsServer.listen(PORT, function () {
    console.log(`${NAME} listening on port: ${PORT}`);
});
