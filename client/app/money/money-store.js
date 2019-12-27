var $store = {
    MONTHS: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    THOUSAND: ' ',
    DECIMAL: ',',

    loading: false,

    name: 'alex',

    accounts: [],

    transactions: [],

    base_tags: [],

    rates: [],

    is_historical_mode: true,

    cur: {
        is_month_view: true,

        account: null,

        month: (new Date()).getMonth(),

        year: (new Date()).getFullYear(),

        begin: 0,

        end: 0,

        delta: 0,

        deltaPercent: 0,

        rateNet: 0,

        net: 0,

        viewNet: 0,

        tx: [],

        tags: [],

        budget: {
            type: 'monthly',
            spent: 0,
            max: 0,
            percentage: 0
        },

        tag: null,

        txType: null
    },

    orderMap: {},

    rate(symbol, ym) {
        if (symbol == "RUB")
            return 1;
        let result = 0;
        if (!ym) {
            result = this.rates[0][symbol];
        } else {
            //correct ym
            let now_ym = this.ym((new Date()).getFullYear(), (new Date()).getMonth());
            if (ym > now_ym)
                ym = 0;
            if (ym % 100 > 11) {
                ym = (Math.floor(ym / 100) + 1) * 100;
            }
            if (!this.rates[ym]) {
                ERROR("store.rate", `$this.rates[${ym}] for symbol ${symbol} not found!`);
                result = this.rates[0][symbol];
            } else {
                result = this.rates[ym][symbol];
            }
        }
        return result || 0;
    },

    ym(year, month) {
        return (year - 2000) * 100 + month;
    },

    ymd(date) {
        return (date.getFullYear() - 2000) * 1000000 + date.getMonth() * 10000 + date.getDate() * 100;
    },

    order(tx) {
        let ymd = this.ymd(tx.date);
        if (!this.orderMap[ymd])
            this.orderMap[ymd] = 0;
        let day_num = ++this.orderMap[ymd];
        tx.order = ymd + day_num;
    },

    next_f41_id() {
        return _.max(this.transactions, tx => tx.f41_id).f41_id + 1;
    },

    //helper functions
    _base_tag_memo: {},

    base_tag(tag_name) {
        if (tag_name && this._base_tag_memo[tag_name])
            return this._base_tag_memo[tag_name];
        let _bt = _.find(this.base_tags, bt => bt.name === tag_name);
        if (tag_name && _bt)
            this._base_tag_memo[tag_name] = _bt;
        return _bt;
    },

    _acc_name_memo: {},

    normal_accounts() {
        return _.filter(this.accounts, acc => !acc.special);
    },

    filter_txs(lambda, special) {
        let txs = special ? this.transactions : _.filter(this.transactions, tx => !this.is_acc_special(tx.src));
        return _.sortBy(_.filter(txs, lambda), tx => tx.date.getTime());
    },

    sum_txs(lambda, toCurr, special) {
        let txs = special ? this.transactions : _.filter(this.transactions, tx => !this.is_acc_special(tx.src));
        if (!toCurr)
            return _.reduce(_.filter(txs, lambda), (memo, tx) => memo + tx.amount, 0);
        else
            return _.reduce(_.filter(txs, lambda), (memo, tx) => memo + this.convertTxAmount(tx, toCurr), 0);
    },

    acc(acc_name) {
        if (!acc_name)
            return null;
        if (acc_name && this._acc_name_memo[acc_name])
            return this._acc_name_memo[acc_name];

        let _acc = _.find(this.accounts, (acc) => acc.name === acc_name);
        if (acc_name && _acc)
            this._acc_name_memo[acc_name] = _acc;
        return _acc;
    },

    acc_currency(acc_name) {
        if (!this.acc(acc_name))
            return null;
        return (this.acc(acc_name)).currency;
    },

    acc_category(acc_name) {
        if (!this.acc(acc_name))
            return "";

        let cat = this.acc(acc_name).category;
        return cat == "crypto" && this.acc_currency(acc_name) == "USD" ? "currency" : cat;
    },

    acc_balance(acc_name) {
        if (!this.acc(acc_name))
            return null;
        return this.acc(acc_name).balance;
    },

    is_acc_current(acc_name) {
        return this.cur.account.name === acc_name;
    },

    is_tag_current(tag) {
        return this.cur.tag === tag;
    },

    no_acc() {
        return this.cur.account === null;
    },

    no_tag() {
        return this.cur.tag === null;
    },

    is_acc_special(acc) {
        if (acc) {
            return this.acc(acc) && this.acc(acc).special;
        } else {
            return this.cur.account && this.cur.account.special;
        }
    },

    random_tag_color() {
        return _.sample(_.pluck(this.base_tags, "color"));
    },

    _tag_color_memo: {},

    tag_color(tag_name) {
        if (tag_name && this._tag_color_memo[tag_name])
            return this._tag_color_memo[tag_name];

        let bt = this.base_tag(tag_name);
        let value = (bt ? this.hexToRgbA(bt.color, '0.61') : "#ffffff");
        if (tag_name && value)
            this._tag_color_memo[tag_name] = value;
        return value;
    },

    stats: {
        totalBalance: 0,
        totalBalance_USD: 0,
        net_worth: 0,
        personal_things: 757000,
        net_balance: 0,
        flat_value: 3975000,
        mortgage: -461656,
        flat_invested: 0,
        flat_equity: 0,
        flat_nw_ratio: 0,
        flat_roi: 0,
        rub_ratio: 0,
        curr_ratio: 0,
        sec_ratio: 0,
        crypto_ratio: 0,
        rateItems: {
            "USDRUB": {
                sym1: 'USD',
                sym2: 'RUB',
                avg_entrance: '',
                category: "2d"
            },
            "EURRUB": {
                sym1: 'EUR',
                sym2: 'RUB',
                avg_entrance: '',
                category: "2d"
            },
            "BTCUSD": {
                sym1: 'BTC',
                sym2: 'USD',
                avg_entrance: '',
                category: "1d"
            },
            "ETHUSD": {
                sym1: 'ETH',
                sym2: 'USD',
                avg_entrance: 0,
                category: "2d"
            },
            "BNBUSD": {
                sym1: 'BNB',
                sym2: 'USD',
                avg_entrance: '',
                category: "2d"
            }
        }
    },

    lastUpdated: null,

    totalHistory: [],

    chartShown: false,

    map_accounts_by_name: {},

    parseAmount(str) {
        if (!isNaN(+str))
            return +str;
        try {
            return eval(str.replace(this.THOUSAND, "").replace(this.DECIMAL, "."));
        } catch (e) {
            return NaN;
        }
    },

    convert(amount, curr1, curr2, ym) {
        return amount * this.rate(curr1, ym) / this.rate(curr2, ym);
    },

    convertTxAmount(tx, curr2) {
        return this.convert(tx.amount, this.acc_currency(tx.src), curr2, this.ym(tx.year, tx.month));
    },

    hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {
            r: 255,
            g: 255,
            b: 255
        };
    },

    hexToRgba(hex, alpha) {
        let rgb = this.hexToRgb(hex);
        return 'rgba(' + rgb.r + ", " + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
    },

    hexToRgbA(hex, opacity) {
        if (!hex)
            return '#ffffff';
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            let c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
        }
    },

};

let $bus = new Vue();

Vue.filter('fmtAmount', (amount, options) => {
    options = options || {};

    if (isNaN(amount))
        return "NaN";
    if (amount === "")
        return amount;
    if (amount % 1 === 0) { //Integer
        options.places = 0;
    }
    let n = amount;
    let places = options.places || 0;
    let t_sep = options.no_thousand ? '' : $store.THOUSAND;
    let d_sep = $store.DECIMAL;
    let sign = n < 0 ? "-" : (options.delta ? "+" : "");
    if (Math.abs(n) == Infinity) {
        return (options.prefix || "") + sign + "∞" + (options.suffix || "");
    }
    if (options.max_n && n > options.max_n) {
        return (options.prefix || "") + ">" + options.max_n + (options.suffix || "");
    }
    let intPart = parseInt(n = Math.abs(+n || 0).toFixed(places)).toString();
    let fracPart = (places ? d_sep + Math.abs(n - intPart).toFixed(places).slice(2) : "");
    if (fracPart.length > 0) {
        while (fracPart[fracPart.length - 1] == "0" && fracPart != d_sep + "0")
            fracPart = fracPart.substr(0, fracPart.length - 1);
    }
    let firstThousandSep = intPart.length > 3 ? intPart.length % 3 : 0;
    let result = (options.prefix || "") + sign +
        (firstThousandSep ? intPart.substr(0, firstThousandSep) + t_sep : "") +
        intPart.substr(firstThousandSep).replace(/(\d{3})(?=\d)/g, "$1" + t_sep) + fracPart + (options.suffix || "");
    return result;
});

Vue.filter('date', (d) => {
    if (!(d instanceof Date))
        return "n/a";
    return moment(d).format("DD.MM.YYYY");
});