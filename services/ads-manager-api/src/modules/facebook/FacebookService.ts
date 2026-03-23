import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface FacebookConfig {
  accessToken: string;
  apiVersion?: string;
  timeout?: number;
}

export interface PaginationParams {
  limit?: number;
  after?: string;
  before?: string;
}

export interface DateRange {
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
}

export interface InsightsParams extends PaginationParams {
  fields?: string[];
  date_preset?: 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_28d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month' | 'lifetime' | 'maximum';
  time_range?: DateRange;
  time_increment?: number | 'monthly' | 'all_days';
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  breakdowns?: string[];
  action_breakdowns?: string[];
  action_report_time?: 'impression' | 'conversion' | 'mixed';
  filtering?: any[];
}

export interface CampaignParams {
  name: string;
  objective: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  special_ad_categories?: string[];
  buying_type?: 'AUCTION' | 'RESERVED';
}

export interface AdSetParams {
  name: string;
  campaign_id: string;
  daily_budget?: number;
  lifetime_budget?: number;
  billing_event?: string;
  optimization_goal?: string;
  bid_amount?: number;
  targeting?: any;
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  start_time?: string;
  end_time?: string;
}

export interface AdParams {
  name: string;
  adset_id: string;
  creative: any;
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
}

export interface CustomAudienceParams {
  name: string;
  subtype: 'CUSTOM' | 'WEBSITE' | 'APP' | 'OFFLINE_CONVERSION' | 'CLAIM' | 'PARTNER' | 'MANAGED' | 'VIDEO' | 'LOOKALIKE' | 'ENGAGEMENT' | 'DATA_SET' | 'BAG_OF_ACCOUNTS' | 'STUDY_RULE_AUDIENCE' | 'FOX';
  description?: string;
  customer_file_source?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

/**
 * Facebook Marketing API Wrapper
 * Comprehensive client for interacting with Facebook Marketing API
 */
export class FacebookMarketingAPI {
  private client: AxiosInstance;
  private accessToken: string;
  private apiVersion: string;
  private baseURL: string;

  constructor(config: FacebookConfig) {
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v19.0';
    this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add access token
    this.client.interceptors.request.use((config) => {
      if (config.params) {
        config.params.access_token = this.accessToken;
      } else {
        config.params = { access_token: this.accessToken };
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const fbError = error.response.data.error;
          throw new Error(
            `Facebook API Error (${fbError.code}): ${fbError.message}` +
            (fbError.error_subcode ? ` [Subcode: ${fbError.error_subcode}]` : '') +
            (fbError.fbtrace_id ? ` [Trace: ${fbError.fbtrace_id}]` : '')
          );
        }
        throw error;
      }
    );
  }

  /**
   * Make a generic GET request
   */
  async get<T = any>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  /**
   * Make a generic POST request
   */
  async post<T = any>(endpoint: string, data?: any, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(endpoint, data, { params });
    return response.data;
  }

  /**
   * Make a generic DELETE request
   */
  async delete<T = any>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.delete(endpoint, { params });
    return response.data;
  }

  // ==================== USER & ACCOUNT METHODS ====================

  /**
   * Get current user information
   */
  async getMe(fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    return this.get('/me', params);
  }

  /**
   * Get all ad accounts accessible by the current user
   */
  async getAdAccounts(fields?: string[], limit?: number): Promise<ApiResponse> {
    const params: any = { limit: limit || 100 };
    if (fields) {
      params.fields = fields.join(',');
    }
    return this.get('/me/adaccounts', params);
  }

  /**
   * Get specific ad account information
   */
  async getAdAccount(accountId: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    const id = this.normalizeAccountId(accountId);
    return this.get(`/${id}`, params);
  }

  // ==================== CAMPAIGN METHODS ====================

  /**
   * Get campaigns for an ad account
   */
  async getCampaigns(
    accountId: string,
    fields?: string[],
    params?: PaginationParams & { filtering?: any[] }
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${id}/campaigns`, queryParams);
  }

  /**
   * Get a specific campaign
   */
  async getCampaign(campaignId: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    return this.get(`/${campaignId}`, params);
  }

  /**
   * Create a new campaign
   */
  async createCampaign(accountId: string, campaignData: CampaignParams): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    return this.post(`/${id}/campaigns`, campaignData);
  }

  /**
   * Update a campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<CampaignParams>): Promise<ApiResponse> {
    return this.post(`/${campaignId}`, updates);
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<ApiResponse> {
    return this.delete(`/${campaignId}`);
  }

  // ==================== AD SET METHODS ====================

  /**
   * Get ad sets for an ad account or campaign
   */
  async getAdSets(
    parentId: string,
    fields?: string[],
    params?: PaginationParams & { filtering?: any[] }
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(parentId);
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${id}/adsets`, queryParams);
  }

  /**
   * Get a specific ad set
   */
  async getAdSet(adsetId: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    return this.get(`/${adsetId}`, params);
  }

  /**
   * Create a new ad set
   */
  async createAdSet(accountId: string, adsetData: AdSetParams): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    return this.post(`/${id}/adsets`, adsetData);
  }

  /**
   * Update an ad set
   */
  async updateAdSet(adsetId: string, updates: Partial<AdSetParams>): Promise<ApiResponse> {
    return this.post(`/${adsetId}`, updates);
  }

  /**
   * Delete an ad set
   */
  async deleteAdSet(adsetId: string): Promise<ApiResponse> {
    return this.delete(`/${adsetId}`);
  }

  // ==================== AD METHODS ====================

  /**
   * Get ads for an ad account, campaign, or ad set
   */
  async getAds(
    parentId: string,
    fields?: string[],
    params?: PaginationParams & { filtering?: any[] }
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(parentId);
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${id}/ads`, queryParams);
  }

  /**
   * Get a specific ad
   */
  async getAd(adId: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    return this.get(`/${adId}`, params);
  }

  /**
   * Create a new ad
   */
  async createAd(accountId: string, adData: AdParams): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    return this.post(`/${id}/ads`, adData);
  }

  /**
   * Update an ad
   */
  async updateAd(adId: string, updates: Partial<AdParams>): Promise<ApiResponse> {
    return this.post(`/${adId}`, updates);
  }

  /**
   * Delete an ad
   */
  async deleteAd(adId: string): Promise<ApiResponse> {
    return this.delete(`/${adId}`);
  }

  // ==================== AD CREATIVE METHODS ====================

  /**
   * Get ad creatives
   */
  async getAdCreatives(
    accountId: string,
    fields?: string[],
    params?: PaginationParams
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${id}/adcreatives`, queryParams);
  }

  /**
   * Get a specific ad creative
   */
  async getAdCreative(creativeId: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    return this.get(`/${creativeId}`, params);
  }

  /**
   * Create an ad creative
   */
  async createAdCreative(accountId: string, creativeData: any): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    return this.post(`/${id}/adcreatives`, creativeData);
  }

  // ==================== INSIGHTS METHODS ====================

  /**
   * Get insights for an ad account
   */
  async getAccountInsights(
    accountId: string,
    params?: InsightsParams
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    return this.getInsights(id, params);
  }

  /**
   * Get insights for a campaign
   */
  async getCampaignInsights(
    campaignId: string,
    params?: InsightsParams
  ): Promise<ApiResponse> {
    return this.getInsights(campaignId, params);
  }

  /**
   * Get insights for an ad set
   */
  async getAdSetInsights(
    adsetId: string,
    params?: InsightsParams
  ): Promise<ApiResponse> {
    return this.getInsights(adsetId, params);
  }

  /**
   * Get insights for an ad
   */
  async getAdInsights(
    adId: string,
    params?: InsightsParams
  ): Promise<ApiResponse> {
    return this.getInsights(adId, params);
  }

  /**
   * Generic method to get insights
   */
  private async getInsights(
    objectId: string,
    params?: InsightsParams
  ): Promise<ApiResponse> {
    const queryParams: any = { ...params };
    
    if (params?.fields) {
      queryParams.fields = params.fields.join(',');
    }
    
    if (params?.breakdowns) {
      queryParams.breakdowns = params.breakdowns.join(',');
    }
    
    if (params?.action_breakdowns) {
      queryParams.action_breakdowns = params.action_breakdowns.join(',');
    }

    if (params?.filtering) {
      queryParams.filtering = JSON.stringify(params.filtering);
    }

    return this.get(`/${objectId}/insights`, queryParams);
  }

  /**
   * Get async insights report (for large data requests)
   */
  async getAsyncInsights(
    objectId: string,
    params?: InsightsParams
  ): Promise<ApiResponse> {
    const queryParams: any = { ...params };
    
    if (params?.fields) {
      queryParams.fields = params.fields.join(',');
    }
    
    if (params?.breakdowns) {
      queryParams.breakdowns = params.breakdowns.join(',');
    }
    
    if (params?.action_breakdowns) {
      queryParams.action_breakdowns = params.action_breakdowns.join(',');
    }

    // Request async report
    const reportResponse = await this.post(`/${objectId}/insights`, null, queryParams);
    return reportResponse;
  }

  /**
   * Check async report status
   */
  async getAsyncReportStatus(reportRunId: string): Promise<ApiResponse> {
    return this.get(`/${reportRunId}`);
  }

  // ==================== CUSTOM AUDIENCE METHODS ====================

  /**
   * Get custom audiences
   */
  async getCustomAudiences(
    accountId: string,
    fields?: string[],
    params?: PaginationParams
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${id}/customaudiences`, queryParams);
  }

  /**
   * Get a specific custom audience
   */
  async getCustomAudience(audienceId: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    return this.get(`/${audienceId}`, params);
  }

  /**
   * Create a custom audience
   */
  async createCustomAudience(
    accountId: string,
    audienceData: CustomAudienceParams
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    return this.post(`/${id}/customaudiences`, audienceData);
  }

  /**
   * Update a custom audience
   */
  async updateCustomAudience(
    audienceId: string,
    updates: Partial<CustomAudienceParams>
  ): Promise<ApiResponse> {
    return this.post(`/${audienceId}`, updates);
  }

  /**
   * Delete a custom audience
   */
  async deleteCustomAudience(audienceId: string): Promise<ApiResponse> {
    return this.delete(`/${audienceId}`);
  }

  /**
   * Add users to a custom audience
   */
  async addUsersToCustomAudience(
    audienceId: string,
    users: any[],
    schema?: string[]
  ): Promise<ApiResponse> {
    const payload: any = {
      payload: {
        data: users,
      },
    };

    if (schema) {
      payload.payload.schema = schema;
    }

    return this.post(`/${audienceId}/users`, payload);
  }

  /**
   * Remove users from a custom audience
   */
  async removeUsersFromCustomAudience(
    audienceId: string,
    users: any[],
    schema?: string[]
  ): Promise<ApiResponse> {
    const payload: any = {
      payload: {
        data: users,
      },
    };

    if (schema) {
      payload.payload.schema = schema;
    }

    return this.delete(`/${audienceId}/users`, payload);
  }

  // ==================== TARGETING SEARCH METHODS ====================

  /**
   * Search for targeting options
   */
  async searchTargeting(
    searchType: 'adinterest' | 'adgeolocation' | 'adeducationschool' | 'adworkemployer' | 'adlocale' | 'adcountry',
    query: string,
    params?: any
  ): Promise<ApiResponse> {
    const queryParams = {
      type: searchType,
      q: query,
      ...params,
    };
    return this.get('/search', queryParams);
  }

  /**
   * Get targeting suggestions
   */
  async getTargetingSuggestions(
    interestList: string[],
    limit?: number
  ): Promise<ApiResponse> {
    const params = {
      interest_list: JSON.stringify(interestList),
      limit: limit || 10,
    };
    return this.get('/search', params);
  }

  // ==================== CONVERSION TRACKING METHODS ====================

  /**
   * Get pixels for an ad account
   */
  async getPixels(
    accountId: string,
    fields?: string[],
    params?: PaginationParams
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${id}/adspixels`, queryParams);
  }

  /**
   * Create a pixel
   */
  async createPixel(accountId: string, name: string): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    return this.post(`/${id}/adspixels`, { name });
  }

  /**
   * Get custom conversions
   */
  async getCustomConversions(
    accountId: string,
    fields?: string[],
    params?: PaginationParams
  ): Promise<ApiResponse> {
    const id = this.normalizeAccountId(accountId);
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${id}/customconversions`, queryParams);
  }

  // ==================== LEAD GENERATION METHODS ====================

  /**
   * Get lead gen forms
   */
  async getLeadGenForms(
    pageId: string,
    fields?: string[],
    params?: PaginationParams
  ): Promise<ApiResponse> {
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${pageId}/leadgen_forms`, queryParams);
  }

  /**
   * Get leads from a form
   */
  async getLeads(
    formId: string,
    fields?: string[],
    params?: PaginationParams
  ): Promise<ApiResponse> {
    const queryParams: any = { ...params };
    if (fields) {
      queryParams.fields = fields.join(',');
    }
    return this.get(`/${formId}/leads`, queryParams);
  }

  // ==================== BATCH REQUEST METHODS ====================

  /**
   * Execute a batch request
   */
  async batch(requests: Array<{ method: string; relative_url: string; body?: string }>): Promise<ApiResponse[]> {
    const batchParam = JSON.stringify(requests);
    const response = await this.post('/', null, { batch: batchParam });
    return JSON.parse(response.data);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Normalize account ID (ensure it has 'act_' prefix)
   */
  private normalizeAccountId(accountId: string): string {
    if (!accountId.startsWith('act_')) {
      return `act_${accountId}`;
    }
    return accountId;
  }

  /**
   * Handle pagination - fetch all pages
   */
  async *fetchAllPages<T = any>(
    endpoint: string,
    params?: any,
    maxPages?: number
  ): AsyncGenerator<T[], void, unknown> {
    let nextUrl: string | undefined;
    let currentPage = 0;

    do {
      const response: ApiResponse<T[]> = nextUrl
        ? await this.get(nextUrl.replace(this.baseURL, ''))
        : await this.get(endpoint, params);

      if (response.data) {
        yield response.data;
      }

      nextUrl = response.paging?.next;
      currentPage++;

      if (maxPages && currentPage >= maxPages) {
        break;
      }
    } while (nextUrl);
  }

  /**
   * Fetch all data from paginated endpoint
   */
  async fetchAll<T = any>(
    endpoint: string,
    params?: any,
    maxPages?: number
  ): Promise<T[]> {
    const allData: T[] = [];
    
    for await (const page of this.fetchAllPages<T>(endpoint, params, maxPages)) {
      allData.push(...page);
    }

    return allData;
  }

  /**
   * Get API version
   */
  getApiVersion(): string {
    return this.apiVersion;
  }

  /**
   * Set API version
   */
  setApiVersion(version: string): void {
    this.apiVersion = version;
    this.baseURL = `https://graph.facebook.com/${version}`;
    this.client.defaults.baseURL = this.baseURL;
  }
}

export default FacebookMarketingAPI;
