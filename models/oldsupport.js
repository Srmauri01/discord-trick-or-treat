import { Schema, model } from 'mongoose';

const oldsupportSchema = new Schema(
  {
    id: { type: String, require: true },
    server_id: { type: String, require: true },
    expirationDate: { type: Date, expires: 0 },
  },
  { versionKey: false }
);

export default model('oldsupport', oldsupportSchema, 'oldsupport');
