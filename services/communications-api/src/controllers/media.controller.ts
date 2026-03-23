import { Request, Response } from 'express';
// import { supabaseAdmin } from '../../../../shared/src/supabase';

export class MediaController {
    static async upload(req: Request, res: Response) {
        const ctx = (req as any).context;
        const { filename, contentType, content } = req.body;

        if (!filename || !contentType || !content) {
            return res.status(400).json({ error: "filename, contentType, and content (base64) are required" });
        }

        try {
            const companyId = ctx.companyId;
            const fileExt = filename.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${companyId}/${fileName}`;

            const buffer = Buffer.from(content, 'base64');

            // Placeholder: In a real MongoDB migration, you'd use GridFS or an S3-compatible store.
            // For now, we return a local mock URL.
            const publicUrl = `https://storage.leadflow-ai.com/communication-attachments/${filePath}`;

            return res.json({
                url: publicUrl,
                path: filePath,
                filename: filename
            });
        } catch (error: any) {
            console.error('[MediaController] Unexpected error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}
