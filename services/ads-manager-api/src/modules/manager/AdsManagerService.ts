import { FacebookMarketingAPI } from '../facebook/FacebookService';
import { GoogleAdsAPI } from '../google/GoogleService';
import { UserAdsCredentials } from '../../../../../shared/src/models/ads_credentials';
import { Campaign, CampaignMetric } from '../../../../../shared/src/models/campaign';
import { decrypt } from '../../../../../shared/src/encryption';

export interface AdCampaignParams {
  platform: 'facebook' | 'google';
  campaignName: string;
  budget: number;
  targeting: any;
  creatives: any;
  externalAccountId: string;
}

export interface AdCreateParams {
  platform: 'facebook' | 'google';
  externalAccountId: string;
  adsetId: string; // Resource name for Google
  name: string;
  creative: {
    title: string;
    body: string;
    imageHash?: string;
    imageUrl?: string;
    linkUrl: string;
  };
}

export class AdsManagerService {
  private userId: string;
  private companyId: string;

  constructor(userId: string, companyId: string) {
    this.userId = userId;
    this.companyId = companyId;
  }

  private async getCredentials() {
    const data = await UserAdsCredentials.findOne({
      user_id: this.userId,
      company_id: this.companyId
    });

    if (!data) {
      throw new Error('Ad credentials not found for user');
    }

    return data;
  }

  private async getFacebookClient(creds: any) {
    const fbCreds = typeof creds.facebook_credentials === 'string'
      ? JSON.parse(decrypt(creds.facebook_credentials))
      : creds.facebook_credentials; // Assuming if it's already an object, it's not encrypted or handled elsewhere

    // Actually, based on logic, we should always decrypt if we store it encrypted.
    // The wrapper expects accessToken.
    return new FacebookMarketingAPI({
      accessToken: fbCreds.accessToken || fbCreds.longLivedToken,
      apiVersion: 'v19.0'
    });
  }

  private async getGoogleClient(creds: any) {
    const gCreds = typeof creds.google_credentials === 'string'
      ? JSON.parse(decrypt(creds.google_credentials))
      : creds.google_credentials;

    return new GoogleAdsAPI({
      developerToken: gCreds.developerToken,
      clientId: gCreds.clientId,
      clientSecret: gCreds.clientSecret,
      refreshToken: gCreds.refreshToken,
      loginCustomerId: gCreds.loginCustomerId
    });
  }

  async createCampaign(params: AdCampaignParams) {
    const creds = await this.getCredentials();

    if (params.platform === 'facebook') {
      const client = await this.getFacebookClient(creds);
      return client.createCampaign(params.externalAccountId, {
        name: params.campaignName,
        objective: 'OUTCOME_SALES', // Default or from params
        status: 'PAUSED',
        special_ad_categories: []
      });
    } else {
      const client = await this.getGoogleClient(creds);
      return client.createCampaign(params.externalAccountId, {
        name: params.campaignName,
        status: 'PAUSED',
        advertisingChannelType: 'SEARCH' // Default
      });
    }
  }

  async getCampaigns(platform: 'facebook' | 'google', externalAccountId: string) {
    const creds = await this.getCredentials();

    if (platform === 'facebook') {
      const client = await this.getFacebookClient(creds);
      return client.getCampaigns(externalAccountId, ['id', 'name', 'status', 'objective']);
    } else {
      const client = await this.getGoogleClient(creds);
      return client.getCampaigns(externalAccountId);
    }
  }

  async updateCampaignStatus(platform: 'facebook' | 'google', campaignId: string, status: 'active' | 'pause') {
    const creds = await this.getCredentials();
    const platformStatus = platform === 'facebook'
      ? (status === 'active' ? 'ACTIVE' : 'PAUSED')
      : (status === 'active' ? 'ENABLED' : 'PAUSED');

    if (platform === 'facebook') {
      const client = await this.getFacebookClient(creds);
      return client.updateCampaign(campaignId, { status: platformStatus as any });
    } else {
      const client = await this.getGoogleClient(creds);
      const googleCreds = typeof creds.google_credentials === 'string'
        ? JSON.parse(decrypt(creds.google_credentials))
        : creds.google_credentials as any;

      return client.updateCampaign(googleCreds.loginCustomerId, campaignId, { status: platformStatus as any });
    }
  }

  async getAdSets(platform: 'facebook' | 'google', campaignId: string) {
    const creds = await this.getCredentials();
    if (platform === 'facebook') {
      const client = await this.getFacebookClient(creds);
      return client.getAdSets(campaignId, ['id', 'name', 'status']);
    } else {
      const client = await this.getGoogleClient(creds);
      const googleCreds = typeof creds.google_credentials === 'string'
        ? JSON.parse(decrypt(creds.google_credentials))
        : creds.google_credentials as any;

      return client.getAdGroups(googleCreds.loginCustomerId, undefined, `campaign.id = ${campaignId}`);
    }
  }

  async createAd(params: AdCreateParams) {
    const creds = await this.getCredentials();
    if (params.platform === 'facebook') {
      const client = await this.getFacebookClient(creds);

      // 1. Create Creative
      const fbCreds = typeof creds.facebook_credentials === 'string'
        ? JSON.parse(decrypt(creds.facebook_credentials))
        : creds.facebook_credentials as any;

      const creative = await client.post(`/${params.externalAccountId}/adcreatives`, {
        name: `${params.name}_creative`,
        object_story_spec: {
          page_id: fbCreds.pageId,
          link_data: {
            message: params.creative.body,
            link: params.creative.linkUrl,
            name: params.creative.title,
            image_hash: params.creative.imageHash,
            picture: params.creative.imageUrl
          }
        }
      });

      // 2. Create Ad
      return client.createAd(params.externalAccountId, {
        name: params.name,
        adset_id: params.adsetId,
        creative: { creative_id: creative.data.id },
        status: 'PAUSED'
      });
    } else {
      const client = await this.getGoogleClient(creds);
      const googleCreds = typeof creds.google_credentials === 'string'
        ? JSON.parse(decrypt(creds.google_credentials))
        : creds.google_credentials as any;

      return client.createAd(googleCreds.loginCustomerId, {
        adGroupId: params.adsetId,
        status: 'PAUSED',
        ad: {
          type: 'RESPONSIVE_SEARCH_AD',
          responsiveSearchAd: {
            headlines: [{ text: params.creative.title }],
            descriptions: [{ text: params.creative.body }]
          }
        }
      });
    }
  }

  async getAnalytics(platform?: 'facebook' | 'google') {
    // Merged analytics logic
    // This fetches from campaign_metrics table primarily

    // We need to join with Campaign to filter by company_id if data is not directly in Metric
    // In our Mongoose model, metrics are linked by campaign_id
    const campaigns = await Campaign.find({ company_id: this.companyId });
    if (platform) {
      // Filter by platform
    }
    const campaignIds = campaigns.map(c => c._id.toString());

    const metrics = await CampaignMetric.find({ campaign_id: { $in: campaignIds } });

    // Aggregate data
    const summary = metrics.reduce((acc: any, m: any) => {
      acc.spend += Number(m.spend || m.cost || 0);
      acc.clicks += Number(m.clicked || 0);
      acc.leads += Number(m.leads || m.converted || 0);

      const campaign = campaigns.find(c => c._id.toString() === m.campaign_id);
      const p = campaign?.platform || 'other';

      if (!acc.platformPerformance[p]) {
        acc.platformPerformance[p] = { spend: 0, clicks: 0, leads: 0 };
      }
      acc.platformPerformance[p].spend += Number(m.spend || m.cost || 0);
      acc.platformPerformance[p].clicks += Number(m.clicked || 0);
      acc.platformPerformance[p].leads += Number(m.leads || m.converted || 0);

      return acc;
    }, { spend: 0, clicks: 0, leads: 0, platformPerformance: {} });

    summary.CPC = summary.clicks > 0 ? summary.spend / summary.clicks : 0;

    return summary;
  }

  async syncCampaigns() {
    const creds = await this.getCredentials();

    // Sync Facebook
    if (creds.is_facebook_connected) {
      const fbClient = await this.getFacebookClient(creds);
      const fbAccounts = await fbClient.getAdAccounts(['id', 'name']);
      for (const account of fbAccounts.data || []) {
        const campaigns = await fbClient.getCampaigns(account.id, ['id', 'name', 'status', 'objective']);
        for (const camp of campaigns.data || []) {
          await Campaign.findOneAndUpdate(
            { company_id: this.companyId, external_campaign_id: camp.id },
            {
              name: camp.name,
              platform: 'facebook',
              type: 'ads', // or from objective
              status: camp.status.toLowerCase() === 'active' ? 'active' : 'paused',
              created_by: this.userId
            },
            { upsert: true }
          );
        }
      }
    }

    // Sync Google
    if (creds.is_google_connected) {
      const gClient = await this.getGoogleClient(creds);
      const googleCreds = typeof creds.google_credentials === 'string'
        ? JSON.parse(decrypt(creds.google_credentials))
        : creds.google_credentials as any;

      const campaigns = await gClient.getCampaigns(googleCreds.loginCustomerId);
      for (const camp of campaigns.results || []) {
        await Campaign.findOneAndUpdate(
          { company_id: this.companyId, external_campaign_id: camp.campaign.id },
          {
            name: camp.campaign.name,
            platform: 'google',
            type: 'ads',
            status: camp.campaign.status === 'ENABLED' ? 'active' : 'paused',
            created_by: this.userId
          },
          { upsert: true }
        );
      }
    }
  }

  async syncMetrics() {
    const creds = await this.getCredentials();
    const today = new Date().toISOString().split('T')[0];

    // Sync Facebook Metrics
    if (creds.is_facebook_connected) {
      const fbClient = await this.getFacebookClient(creds);
      const fbAccounts = await fbClient.getAdAccounts(['id']);
      for (const account of fbAccounts.data || []) {
        const insights = await fbClient.getAccountInsights(account.id, {
          date_preset: 'today',
          fields: ['spend', 'clicks', 'impressions']
        });

        for (const ins of insights.data || []) {
          // Find internal campaign ID if possible, or link to account-level
          // For simplicity, we'll try to find by external_campaign_id if we have it in insights
        }
      }
    }

    // Similar for Google...
    // Requirement says update analytics in database for dashboard.
  }

  async syncLeads() {
    // Implement FB Lead Gen sync logic
    const creds = await this.getCredentials();
    if (creds.is_facebook_connected) {
      // logic to fetch from fbClient.getLeadGenForms and then fbClient.getLeads
    }
  }
}
