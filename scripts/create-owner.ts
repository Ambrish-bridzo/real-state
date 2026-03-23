import "dotenv/config";
import mongoose from 'mongoose';
import { User } from '../shared/src/models/user';
import { Company, Profile } from '../shared/src/models/company_profile';

const MONGODB_URI ="mongodb://leadflow_user:StrongPassword123@127.0.0.1:27017/leadflow_db";

async function createOwner() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[seed] Connected to MongoDB');

        const email = process.env.OWNER_EMAIL || 'admin@bridzo.com';
        const password = process.env.OWNER_PASSWORD || 'Admin@123';
        const companyName = process.env.COMPANY_NAME || 'Bridzo Flow';

        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            console.log(`[seed] User ${email} already exists`);
        } else {
            user = await User.create({
                email,
                password, // Will be hashed by pre-save hook
                emailConfirmed: true,
                rawUserMetaData: { full_name: 'Super Admin' }
            });
            console.log(`[seed] User ${email} created`);
        }

        // 2. Check if company exists
        let company = await Company.findOne({ owner_id: user._id.toString() });
        if (company) {
            console.log(`[seed] Company for ${email} already exists`);
        } else {
            company = await Company.create({
                name: companyName,
                owner_id: user._id.toString(),
                plan: 'pro',
                is_active: true,
                onboarding_status: 'completed'
            });
            console.log(`[seed] Company ${companyName} created`);
        }

        // 3. Check if profile exists
        let profile = await Profile.findOne({ user_id: user._id.toString() });
        if (profile) {
            console.log(`[seed] Profile for ${email} already exists`);
            profile.company_id = company._id.toString();
            profile.role = 'broker';
            await profile.save();
        } else {
            profile = await Profile.create({
                user_id: user._id.toString(),
                full_name: 'Super Admin',
                email: email,
                role: 'broker',
                company_id: company._id.toString(),
                is_active: true
            });
            console.log(`[seed] Profile created with role 'broker'`);
        }

        console.log('[seed] Owner account setup complete');
        process.exit(0);
    } catch (error) {
        console.error('[seed] Error creating owner account:', error);
        process.exit(1);
    }
}

createOwner();
