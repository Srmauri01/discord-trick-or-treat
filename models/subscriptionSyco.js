import { Schema, model } from 'mongoose';

const subscriptionSycoSchema = new Schema({
    bot_name: String,
    servers: Array,
    status: { type: String, default: null },
    subscription: { type: Array, default: [{ name: 'Bot Personalizado (SycoBot)', cost: 30, }] },
    date_end: Number,
    invoiced: { type: Boolean, default: false },
    extended: { type: Boolean, default: false },
    pay_pendings: { type: Array, default: [] },
    disscounts: { type: Array, default: [] },
    vitalice: { type: Boolean, default: true },
}, { versionKey: false });

export default model('subscriptionSyco', subscriptionSycoSchema, 'subscriptionSyco');