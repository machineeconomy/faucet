# IOTA DEVNET FAUCET

This service sends IOTA Devnet tokens to an address provided by a HTTP request to tis endpoint: 

`/send_tokens?address=<ADDRESS>`


## Setup
Clone the repo, install dependencies.

```bash
git clone https://github.com/machineeconomy/faucet
cd faucet
npm i
npm start
```


Create a `.env` file with the following content:

```bash
SEED=<YOUR_SEED>
PORT=<YOUR_PORT>
```

Then start the nodejs server
```bash
npm start
```

