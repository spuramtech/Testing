module.exports = {
  mandatoryFields: [
    { id: 'TC_GF_MF01', label: 'Chit Value', expectedMsg: 'Chit Value Required' },
    { id: 'TC_GF_MF02', label: 'Chit Period', expectedMsg: 'Chit Period Required' },
    { id: 'TC_GF_MF03', label: 'Chit Group Code', expectedMsg: 'Chit Group Code Required' },
    { id: 'TC_GF_MF04', label: 'Maximum Subscription', expectedMsg: 'Maximum Subscription Required' },
    { id: 'TC_GF_MF05', label: 'Auction Date', expectedMsg: 'Auction Date Required' },
  ],
  percentBoundary: [
    { id: 'TC_GF_BV08', label: 'Maximum Discount over 100%', field: 'Maxdiscount', value: '150' },
    { id: 'TC_GF_BV09', label: 'Foreman Commission negative', field: 'Foremencommission', value: '-5' },
    { id: 'TC_GF_BV10', label: 'Breach of Contract non-numeric', field: 'Breachofcontract', value: 'abc' },
  ],
  noOfAuctionsBoundary: [
    { id: 'TC_GF_BV11', label: 'Negative No. of Auctions', field: 'Noofauction', value: '-5' },
    { id: 'TC_GF_BV12', label: 'Non-numeric No. of Auctions', field: 'Noofauction', value: 'abc' },
  ],
  subscriptionBoundary: [
    { id: 'TC_GF_BV13', label: 'Negative Maximum Subscription', field: 'Subscription', value: '-1' },
    { id: 'TC_GF_BV14', label: 'Non-numeric Maximum Subscription', field: 'Subscription', value: 'xx' },
  ],
  specialCharPayloads: [
    { id: 'TC_GF_XSS01', label: 'XSS payload in Chit Group Code', field: 'Groupcode', value: '<script>alert(1)</script>' },
  ],
};
