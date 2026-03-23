import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!';

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

export function decrypt(text: string): string {
    try {
        const parts = text.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format');
        }
        
        const [ivHex, encryptedHex, tagHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        return text; // Fallback to original text if decryption fails (e.g. if it wasn't encrypted)
    }
}
