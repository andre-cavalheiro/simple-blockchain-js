# Description

This is an experemental project to learn the basics of blockchain.


# To run
Start by installing dependencies 

```bash
npm install
```

You can then run a mongodb db (each node requires it's own):

```bash
mkdir /tmp/test
mongod --dbpath=/tmp/test
```
You can create Mongo instance for 3 nodes by running the initDB script

```bash
./helperFiles/initDB.sh
```

Then start some peers:

```bash
npm start
npm first
npm second
```

You can find a Postman configuration file with the API requests configured and ready for testing in helperFiles/postmanExport.json

