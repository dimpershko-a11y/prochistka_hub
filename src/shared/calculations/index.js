export const calculations = {
  roundMoney(value) {
    return Math.round(Number(value || 0));
  },

  multiplyPriceByArea(pricePerSquareMeter, area) {
    return this.roundMoney(Number(pricePerSquareMeter || 0) * Number(area || 0));
  },

  applyPercent(value, percent) {
    return this.roundMoney(Number(value || 0) * (1 + Number(percent || 0) / 100));
  }
};
