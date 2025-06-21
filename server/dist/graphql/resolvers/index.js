"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const authResolvers_1 = require("./authResolvers");
const transactionResolvers_1 = require("./transactionResolvers");
// Merge all resolvers
exports.resolvers = {
    Query: Object.assign(Object.assign({}, authResolvers_1.authResolvers.Query), transactionResolvers_1.transactionResolvers.Query),
    Mutation: Object.assign(Object.assign({}, authResolvers_1.authResolvers.Mutation), transactionResolvers_1.transactionResolvers.Mutation),
    Transaction: Object.assign({}, transactionResolvers_1.transactionResolvers.Transaction),
};
