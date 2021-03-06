const crypt = require("crypto"),
      request = require("request");


const PayuNewOrder = function() {
    this.__main__ = {
        key: '',
        txnid: '',
        amount: 0,
        productinfo: '',
        firstname: '',
        lastname: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        email: '',
        phone: '',
        udf1: '',
        udf2: '',
        udf3: '',
        udf4: '',
        udf5: '',
        surl: '',
        furl: '',
        hash: '',
        service_provider: '',
    }; 
    this.salt = '';  
    this.madeHash = false;
    this.url = '';
};

/**
 * Adds the object properties from the argument object to the Payu main object.
 * @param {Object} payment - Properties from this object will be updated in the main object.
 */
PayuNewOrder.prototype.Create = function(payment, secure) {    
    try {
        if (payment) {
            // If it is not secure and hash is not made then we add test data.
            if (secure !== undefined && secure === false) {
                this.__main__.key = "rjQUPktU";
                this.salt = "e5iIg1jwi8";
                this.url = "https://test.payu.in/_payment";
            } else {
                this.url = "https://secure.payu.in/_payment";                
            }
            if ("salt" in payment) this.salt = payment.salt;
            for (let prop in payment) {
                if (prop in this.__main__) this.__main__[prop] = payment[prop];
            }
        } else {
            throw new Error("Nothing to update!");
        }        
    } catch (e) {
        console.error(e);
        return false;
    }
};

// They are the same thing, name change just for semantics.
PayuNewOrder.prototype.update = PayuNewOrder.prototype.Create;


/**
 * Creates a random TXNID string of given length.
 * @param len {Number} Length of the resulting random string.
 * @returns {String} A random string of given length.
 */
PayuNewOrder.prototype.randTxn = function(len) {
    let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let r = "";
    for (let i = 0; i < (len + 1); i++) r += chars[Math.floor(Math.random() * chars.length)];
    return r;
};

/**
 * Checks if the data is valid to send a payment.
 * @returns {Boolean} A boolean value reffering if the data is acceptable or not.
 */
PayuNewOrder.prototype.checkValidity = function() {
    try {
        if (this.salt === "") {
            console.log(this.salt);
            throw new Error("'salt' parameter is empty / null!");
            return false;            
        }
        let imp = ["key", "txnid", "amount", "productinfo", "firstname", "email", "phone", "surl", "furl", "service_provider"];
        for (let i = 0; i < imp.length; i++) {
            if (this.__main__[imp[i]] === "" || this.__main__[imp[i]] === null) throw new Error("'" + imp[i] + "' parameter is empty / null!");
        }
        return true;        
    } catch (e) {
        console.error(e);
        return false;
    }
};

/**
 * Creates a hash with the given data.
 * @returns {String|Boolean} Returns the hash if valid, else returns false.
 */
PayuNewOrder.prototype.makeHash = function() {
    try {
        let hashString = "";

        // CHECK 
        if (this.__main__.txnid.length < 1) this.__main__.txnid = this.randTxn(36);
        let essentials = ["key", "txnid", "amount", "productinfo", "firstname", "email", "udf1", "udf2", "udf3", "udf4", "udf5"];
        if (! this.checkValidity()) throw new Error("Please make sure all cumpolsary parameters are added!");

        // MAKE
        for (ess of essentials) {
            hashString += this.__main__[ess] + "|";
        }
        hashString += "|||||" + this.salt;

        // HASH
        let hash = crypt.createHash("sha512");
        hash.update(hashString);
        this.__main__.hash = String.prototype.toLowerCase.call(hash.digest('hex'));

        return this.__main__.hash;
    } catch (e) {
        console.error(e);
        return false;
    }    
}

/**
 * Sends this.__main__ data to payumoney.
 * @returns {Promise} Returns a promise object that resolves with a redirect url or rejects with a http page data.
 */
PayuNewOrder.prototype.sendReq = function() {
    return new Promise((resolve, reject) => {
        if (this.makeHash()) {
            console.log(this.__main__);
            request.post({ url: this.url, form: this.__main__ }, function(err, httpRes, body) {
                if (err) res.send(err);
                else if (httpRes.statusCode >= 300 && httpRes.statusCode <= 400) {
                    resolve(httpRes.headers.location.toString());                    
                }
                else {
                    reject(body);
                }
            });
        } else {
            reject("Error!");
        }
    });
};


module.exports = {
    newOrder: new PayuNewOrder(),
};
