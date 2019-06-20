var app = require('express')();
var cors = require('cors')
app.use(cors())


var core = require('@iota/core');
var validator = require('@iota/validators');
var iota = core.composeAPI({
    provider: 'https://nodes.devnet.thetangle.org:443'
})

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT
const SEED = process.env.SEED

var keyIndex = 0
var payoutamount = 10
//before sending you should check if the previous transaction is confirmed and if it's unconfirmed promote/reattach it or wait
//sendIotas(payoutaddress, keyIndex)

app.get('/', (req, res) => res.send(`Welcome to the AKITA IOTA Devnet Faucet`))

app.post('/send_tokens', function (request, response) {
    if (request.query.hasOwnProperty('address')) {
        let payoutaddress = request.query.address

        if(validator.isAddress(payoutaddress)) {
            response.json({ status: "ok", address: payoutaddress, message: "Sent IOTA Tokens to the given address." });

        } else {
            response.json({ status: "error", message: "Invalid IOTA address." });
        }

    } else {
        response.json({ status: "error", message: "'address' not in the query." });
    }
})

var server = app.listen(PORT, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})

async function sendIotas(payoutaddress, keyIndex) {
    let inputAddress = core.generateAddress(seed, keyIndex, 2)
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
            address: core.generateAddress(seed, keyIndex + 1, 2)
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
            //update keyIndex for next transfer and store it somewhere
            keyIndex++
        })
        .catch(err => {
            console.log(err)
        })
}