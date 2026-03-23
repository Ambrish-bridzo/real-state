import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password?: string;
    emailConfirmed: boolean;
    rawUserMetaData?: any;
    twoFactorEnabled: boolean;
    twoFactorMethod?: 'email' | 'authenticator' | null;
    twoFactorSecret?: string | null;
    twoFactorTempSecret?: string | null;
    twoFactorCodeHash?: string | null;
    twoFactorCodeExpiresAt?: Date | null;
    recoveryCodeHashes: string[];
    trustedDevices: Array<{
        tokenHash: string;
        expiresAt: Date;
        createdAt: Date;
        lastUsedAt?: Date | null;
        label?: string | null;
    }>;
    loginNotificationsEnabled: boolean;
    lastLoginAt?: Date | null;
    lastLoginIp?: string | null;
    resetPasswordTokenHash?: string | null;
    resetPasswordExpiresAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: false },
    emailConfirmed: { type: Boolean, default: false },
    rawUserMetaData: { type: Schema.Types.Mixed, default: {} },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['email', 'authenticator'], default: null },
    twoFactorSecret: { type: String, default: null },
    twoFactorTempSecret: { type: String, default: null },
    twoFactorCodeHash: { type: String, default: null },
    twoFactorCodeExpiresAt: { type: Date, default: null },
    recoveryCodeHashes: { type: [String], default: [] },
    trustedDevices: {
        type: [{
            tokenHash: { type: String, required: true },
            expiresAt: { type: Date, required: true },
            createdAt: { type: Date, required: true, default: Date.now },
            lastUsedAt: { type: Date, default: null },
            label: { type: String, default: null },
        }],
        default: [],
    },
    loginNotificationsEnabled: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
});

export const User = mongoose.model<IUser>('User', UserSchema);
