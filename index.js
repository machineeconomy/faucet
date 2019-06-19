var core = require('@iota/core');
var iota = core.composeAPI({
    provider: 'https://nodes.devnet.thetangle.org:443'
})

const seed = ''

var payoutaddress = ''
var keyIndex = 0
var payoutamount = 10
//before sending you should check if the previous transaction is confirmed and if it's unconfirmed promote/reattach it or wait
//sendIotas(payoutaddress, keyIndex)

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
        .prepareTransfers(seed, transfers, options)
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