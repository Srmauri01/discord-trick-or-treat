import { Schema, model } from 'mongoose';

const activesupportSchema = new Schema({
    id: String,
    user_id: String,
    channel_id: String,
    ticket_id: String,
    status: String,
    closed_by: { type: String, default: null },
    open_by: { type: String, default: null },
    participants: { type: Array, default: [] }
}, { versionKey: false });

export default model('activesupport', activesupportSchema, 'activesupport');