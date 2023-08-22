import { Schema, model } from 'mongoose';

const supportlogsSchema = new Schema({
    user_id: String,
    discord: { type: Number, default: 0 },
    twitch: { type: Number, default: 0 },
    eventos: { type: Number, default: 0 }
}, { versionKey: false });

export default model('supportlogs', supportlogsSchema, 'supportlogs');