import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface GoogleAdsConfig {
  developerToken: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  loginCustomerId?: string;
  apiVersion?: string;
  timeout?: number;
}

export interface GAQLQueryOptions {
  customerId: string;
  query: string;
  pageSize?: number;
  pageToken?: string;
  validateOnly?: boolean;
  returnTotalResultsCount?: boolean;
}

export interface CampaignParams {
  name: string;
  status?: 'ENABLED' | 'PAUSED' | 'REMOVED';
  advertisingChannelType?: 'SEARCH' | 'DISPLAY' | 'SHOPPING' | 'HOTEL' | 'VIDEO' | 'MULTI_CHANNEL' | 'LOCAL' | 'SMART' | 'PERFORMANCE_MAX' | 'LOCAL_SERVICES' | 'DISCOVERY' | 'TRAVEL';
  biddingStrategyType?: string;
  targetCpa?: number;
  targetRoas?: number;
  budgetId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdGroupParams {
  name: string;
  campaignId: string;
  status?: 'ENABLED' | 'PAUSED' | 'REMOVED';
  type?: 'SEARCH_STANDARD' | 'DISPLAY_STANDARD' | 'SHOPPING_PRODUCT_ADS' | 'VIDEO_TRUE_VIEW_IN_STREAM' | 'VIDEO_TRUE_VIEW_IN_DISPLAY';
  cpcBidMicros?: number;
  cpmBidMicros?: number;
  cpvBidMicros?: number;
}

export interface AdParams {
  adGroupId: string;
  status?: 'ENABLED' | 'PAUSED' | 'REMOVED';
  finalUrls?: string[];
  finalMobileUrls?: string[];
  ad: {
    type: 'EXPANDED_TEXT_AD' | 'RESPONSIVE_SEARCH_AD' | 'RESPONSIVE_DISPLAY_AD' | 'VIDEO_AD' | 'APP_AD' | 'CALL_AD' | 'IMAGE_AD';
    [key: string]: any;
  };
}

export interface KeywordParams {
  adGroupId: string;
  keyword: string;
  matchType: 'EXACT' | 'PHRASE' | 'BROAD';
  status?: 'ENABLED' | 'PAUSED' | 'REMOVED';
  cpcBidMicros?: number;
  finalUrls?: string[];
}

export interface BudgetParams {
  name: string;
  amountMicros: number;
  deliveryMethod?: 'STANDARD' | 'ACCELERATED';
  explicitlyShared?: boolean;
}

export interface ApiResponse<T = any> {
  results?: T[];
  fieldMask?: string;
  nextPageToken?: string;
  totalResultsCount?: number;
  error?: {
    code: number;
    message: string;
    status: string;
    details?: any[];
  };
}

export interface MutateOperation {
  campaignOperation?: any;
  adGroupOperation?: any;
  adGroupAdOperation?: any;
  adGroupCriterionOperation?: any;
  campaignBudgetOperation?: any;
  [key: string]: any;
}

export interface MutateRequest {
  customerId: string;
  mutateOperations: MutateOperation[];
  partialFailure?: boolean;
  validateOnly?: boolean;
  responseContentType?: 'RESOURCE_NAME_ONLY' | 'MUTABLE_RESOURCE';
}

/**
 * Google Ads API Wrapper
 * Comprehensive client for interacting with Google Ads API using REST interface
 */
export class GoogleAdsAPI {
  private client: AxiosInstance;
  private developerToken: string;
  private loginCustomerId?: string;
  private apiVersion: string;
  private baseURL: string;
  private accessToken?: string;
  private refreshToken?: string;
  private clientId?: string;
  private clientSecret?: string;

  constructor(config: GoogleAdsConfig) {
    this.developerToken = config.developerToken;
    this.loginCustomerId = config.loginCustomerId;
    this.apiVersion = config.apiVersion || 'v18';
    this.baseURL = `https://googleads.googleapis.com/${this.apiVersion}`;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 60000,
      headers: {
        'Content-Type': 'application/json',
        'developer-token': this.developerToken,
      },
    });

    // Request interceptor to add authorization and login-customer-id
    this.client.interceptors.request.use(async (config) => {
      // Refresh token if needed
      if (this.refreshToken && this.shouldRefreshToken()) {
        await this.refreshAccessToken();
      }

      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }

      if (this.loginCustomerId && !config.headers['login-customer-id']) {
        config.headers['login-customer-id'] = this.loginCustomerId;
      }

      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const gError = error.response.data.error;
          throw new Error(
            `Google Ads API Error (${gError.code}): ${gError.message}` +
            (gError.status ? ` [Status: ${gError.status}]` : '')
          );
        }
        throw error;
      }
    );
  }

  /**
   * Check if access token should be refreshed
   */
  private shouldRefreshToken(): boolean {
    // Implement token expiry logic here
    // For now, return false
    return false;
  }

  /**
   * Refresh the OAuth access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error('Missing credentials for token refresh');
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      });

      this.accessToken = response.data.access_token;
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Set access token manually
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Set login customer ID
   */
  setLoginCustomerId(customerId: string): void {
    this.loginCustomerId = customerId;
  }

  // ==================== CUSTOMER METHODS ====================

  /**
   * List accessible customers
   */
  async listAccessibleCustomers(): Promise<ApiResponse> {
    const response = await this.client.get('/customers:listAccessibleCustomers');
    return response.data;
  }

  /**
   * Get customer information
   */
  async getCustomer(customerId: string, fields?: string[]): Promise<any> {
    const query = this.buildQuery('customer', fields || [
      'customer.id',
      'customer.descriptive_name',
      'customer.currency_code',
      'customer.time_zone',
      'customer.resource_name'
    ]);

    return this.search(customerId, query);
  }

  // ==================== QUERY METHODS (GAQL) ====================

  /**
   * Execute a GAQL query using GoogleAdsService.Search
   */
  async search<T = any>(customerId: string, query: string, pageSize?: number): Promise<ApiResponse<T>> {
    const body: any = { query };
    
    if (pageSize) {
      body.pageSize = pageSize;
    }

    const response = await this.client.post(
      `/customers/${this.normalizeCustomerId(customerId)}/googleAds:search`,
      body
    );

    return response.data;
  }

  /**
   * Execute a GAQL query using GoogleAdsService.SearchStream
   * Returns an async iterator for streaming results
   */
  async searchStream<T = any>(
    customerId: string,
    query: string
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(
      `/customers/${this.normalizeCustomerId(customerId)}/googleAds:searchStream`,
      { query }
    );

    return response.data;
  }

  /**
   * Helper method to build GAQL queries
   */
  private buildQuery(resource: string, fields: string[], where?: string, orderBy?: string, limit?: number): string {
    let query = `SELECT ${fields.join(', ')} FROM ${resource}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return query;
  }

  // ==================== CAMPAIGN METHODS ====================

  /**
   * List campaigns
   */
  async getCampaigns(
    customerId: string,
    fields?: string[],
    filter?: string,
    orderBy?: string,
    limit?: number
  ): Promise<ApiResponse> {
    const defaultFields = [
      'campaign.id',
      'campaign.name',
      'campaign.status',
      'campaign.advertising_channel_type',
      'campaign.bidding_strategy_type',
      'campaign.resource_name'
    ];

    const query = this.buildQuery(
      'campaign',
      fields || defaultFields,
      filter,
      orderBy,
      limit
    );

    return this.search(customerId, query);
  }

  /**
   * Get a specific campaign
   */
  async getCampaign(customerId: string, campaignId: string, fields?: string[]): Promise<any> {
    const defaultFields = [
      'campaign.id',
      'campaign.name',
      'campaign.status',
      'campaign.advertising_channel_type',
      'campaign.bidding_strategy_type',
      'campaign.start_date',
      'campaign.end_date',
      'campaign.resource_name'
    ];

    const query = this.buildQuery(
      'campaign',
      fields || defaultFields,
      `campaign.id = ${campaignId}`
    );

    const result = await this.search(customerId, query);
    return result.results?.[0];
  }

  /**
   * Create a campaign
   */
  async createCampaign(customerId: string, campaign: CampaignParams): Promise<ApiResponse> {
    const operation = {
      create: {
        name: campaign.name,
        status: campaign.status || 'PAUSED',
        advertisingChannelType: campaign.advertisingChannelType || 'SEARCH',
        biddingStrategyType: campaign.biddingStrategyType,
        campaignBudget: campaign.budgetId,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      }
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        campaignOperation: operation
      }]
    });
  }

  /**
   * Update a campaign
   */
  async updateCampaign(
    customerId: string,
    campaignResourceName: string,
    updates: Partial<CampaignParams>
  ): Promise<ApiResponse> {
    const operation = {
      update: {
        resourceName: campaignResourceName,
        ...updates
      },
      updateMask: this.buildUpdateMask(updates)
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        campaignOperation: operation
      }]
    });
  }

  /**
   * Delete (remove) a campaign
   */
  async removeCampaign(customerId: string, campaignResourceName: string): Promise<ApiResponse> {
    const operation = {
      remove: campaignResourceName
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        campaignOperation: operation
      }]
    });
  }

  // ==================== AD GROUP METHODS ====================

  /**
   * List ad groups
   */
  async getAdGroups(
    customerId: string,
    fields?: string[],
    filter?: string,
    orderBy?: string,
    limit?: number
  ): Promise<ApiResponse> {
    const defaultFields = [
      'ad_group.id',
      'ad_group.name',
      'ad_group.status',
      'ad_group.type',
      'ad_group.campaign',
      'ad_group.resource_name'
    ];

    const query = this.buildQuery(
      'ad_group',
      fields || defaultFields,
      filter,
      orderBy,
      limit
    );

    return this.search(customerId, query);
  }

  /**
   * Get a specific ad group
   */
  async getAdGroup(customerId: string, adGroupId: string, fields?: string[]): Promise<any> {
    const defaultFields = [
      'ad_group.id',
      'ad_group.name',
      'ad_group.status',
      'ad_group.type',
      'ad_group.campaign',
      'ad_group.cpc_bid_micros',
      'ad_group.resource_name'
    ];

    const query = this.buildQuery(
      'ad_group',
      fields || defaultFields,
      `ad_group.id = ${adGroupId}`
    );

    const result = await this.search(customerId, query);
    return result.results?.[0];
  }

  /**
   * Create an ad group
   */
  async createAdGroup(customerId: string, adGroup: AdGroupParams): Promise<ApiResponse> {
    const operation = {
      create: {
        name: adGroup.name,
        campaign: `customers/${this.normalizeCustomerId(customerId)}/campaigns/${adGroup.campaignId}`,
        status: adGroup.status || 'ENABLED',
        type: adGroup.type || 'SEARCH_STANDARD',
        cpcBidMicros: adGroup.cpcBidMicros,
      }
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupOperation: operation
      }]
    });
  }

  /**
   * Update an ad group
   */
  async updateAdGroup(
    customerId: string,
    adGroupResourceName: string,
    updates: Partial<AdGroupParams>
  ): Promise<ApiResponse> {
    const operation = {
      update: {
        resourceName: adGroupResourceName,
        ...updates
      },
      updateMask: this.buildUpdateMask(updates)
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupOperation: operation
      }]
    });
  }

  /**
   * Remove an ad group
   */
  async removeAdGroup(customerId: string, adGroupResourceName: string): Promise<ApiResponse> {
    const operation = {
      remove: adGroupResourceName
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupOperation: operation
      }]
    });
  }

  // ==================== AD METHODS ====================

  /**
   * List ads
   */
  async getAds(
    customerId: string,
    fields?: string[],
    filter?: string,
    orderBy?: string,
    limit?: number
  ): Promise<ApiResponse> {
    const defaultFields = [
      'ad_group_ad.ad.id',
      'ad_group_ad.ad.name',
      'ad_group_ad.status',
      'ad_group_ad.ad.type',
      'ad_group_ad.ad_group',
      'ad_group_ad.resource_name'
    ];

    const query = this.buildQuery(
      'ad_group_ad',
      fields || defaultFields,
      filter,
      orderBy,
      limit
    );

    return this.search(customerId, query);
  }

  /**
   * Get a specific ad
   */
  async getAd(customerId: string, adId: string, fields?: string[]): Promise<any> {
    const defaultFields = [
      'ad_group_ad.ad.id',
      'ad_group_ad.ad.name',
      'ad_group_ad.status',
      'ad_group_ad.ad.type',
      'ad_group_ad.ad.final_urls',
      'ad_group_ad.resource_name'
    ];

    const query = this.buildQuery(
      'ad_group_ad',
      fields || defaultFields,
      `ad_group_ad.ad.id = ${adId}`
    );

    const result = await this.search(customerId, query);
    return result.results?.[0];
  }

  /**
   * Create an ad
   */
  async createAd(customerId: string, ad: AdParams): Promise<ApiResponse> {
    const operation = {
      create: {
        adGroup: `customers/${this.normalizeCustomerId(customerId)}/adGroups/${ad.adGroupId}`,
        status: ad.status || 'ENABLED',
        ad: ad.ad
      }
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupAdOperation: operation
      }]
    });
  }

  /**
   * Update an ad
   */
  async updateAd(
    customerId: string,
    adResourceName: string,
    updates: Partial<AdParams>
  ): Promise<ApiResponse> {
    const operation = {
      update: {
        resourceName: adResourceName,
        ...updates
      },
      updateMask: this.buildUpdateMask(updates)
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupAdOperation: operation
      }]
    });
  }

  /**
   * Remove an ad
   */
  async removeAd(customerId: string, adResourceName: string): Promise<ApiResponse> {
    const operation = {
      remove: adResourceName
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupAdOperation: operation
      }]
    });
  }

  // ==================== KEYWORD METHODS ====================

  /**
   * List keywords
   */
  async getKeywords(
    customerId: string,
    fields?: string[],
    filter?: string,
    orderBy?: string,
    limit?: number
  ): Promise<ApiResponse> {
    const defaultFields = [
      'ad_group_criterion.criterion_id',
      'ad_group_criterion.keyword.text',
      'ad_group_criterion.keyword.match_type',
      'ad_group_criterion.status',
      'ad_group_criterion.ad_group',
      'ad_group_criterion.resource_name'
    ];

    const query = this.buildQuery(
      'ad_group_criterion',
      fields || defaultFields,
      filter ? `${filter} AND ad_group_criterion.type = 'KEYWORD'` : `ad_group_criterion.type = 'KEYWORD'`,
      orderBy,
      limit
    );

    return this.search(customerId, query);
  }

  /**
   * Add a keyword
   */
  async addKeyword(customerId: string, keyword: KeywordParams): Promise<ApiResponse> {
    const operation = {
      create: {
        adGroup: `customers/${this.normalizeCustomerId(customerId)}/adGroups/${keyword.adGroupId}`,
        status: keyword.status || 'ENABLED',
        keyword: {
          text: keyword.keyword,
          matchType: keyword.matchType
        },
        cpcBidMicros: keyword.cpcBidMicros,
        finalUrls: keyword.finalUrls
      }
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupCriterionOperation: operation
      }]
    });
  }

  /**
   * Update a keyword
   */
  async updateKeyword(
    customerId: string,
    keywordResourceName: string,
    updates: Partial<KeywordParams>
  ): Promise<ApiResponse> {
    const operation = {
      update: {
        resourceName: keywordResourceName,
        ...updates
      },
      updateMask: this.buildUpdateMask(updates)
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupCriterionOperation: operation
      }]
    });
  }

  /**
   * Remove a keyword
   */
  async removeKeyword(customerId: string, keywordResourceName: string): Promise<ApiResponse> {
    const operation = {
      remove: keywordResourceName
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        adGroupCriterionOperation: operation
      }]
    });
  }

  // ==================== BUDGET METHODS ====================

  /**
   * List campaign budgets
   */
  async getBudgets(
    customerId: string,
    fields?: string[],
    filter?: string,
    limit?: number
  ): Promise<ApiResponse> {
    const defaultFields = [
      'campaign_budget.id',
      'campaign_budget.name',
      'campaign_budget.amount_micros',
      'campaign_budget.delivery_method',
      'campaign_budget.resource_name'
    ];

    const query = this.buildQuery(
      'campaign_budget',
      fields || defaultFields,
      filter,
      undefined,
      limit
    );

    return this.search(customerId, query);
  }

  /**
   * Create a campaign budget
   */
  async createBudget(customerId: string, budget: BudgetParams): Promise<ApiResponse> {
    const operation = {
      create: {
        name: budget.name,
        amountMicros: budget.amountMicros,
        deliveryMethod: budget.deliveryMethod || 'STANDARD',
        explicitlyShared: budget.explicitlyShared || false
      }
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        campaignBudgetOperation: operation
      }]
    });
  }

  /**
   * Update a budget
   */
  async updateBudget(
    customerId: string,
    budgetResourceName: string,
    updates: Partial<BudgetParams>
  ): Promise<ApiResponse> {
    const operation = {
      update: {
        resourceName: budgetResourceName,
        ...updates
      },
      updateMask: this.buildUpdateMask(updates)
    };

    return this.mutate(customerId, {
      mutateOperations: [{
        campaignBudgetOperation: operation
      }]
    });
  }

  // ==================== REPORTING METHODS ====================

  /**
   * Get campaign performance report
   */
  async getCampaignReport(
    customerId: string,
    dateRange?: string,
    metrics?: string[],
    segments?: string[]
  ): Promise<ApiResponse> {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.conversions_value',
      'metrics.ctr',
      'metrics.average_cpc'
    ];

    const fields = [
      'campaign.id',
      'campaign.name',
      ...metrics || defaultMetrics
    ];

    if (segments) {
      fields.push(...segments);
    }

    let filter = undefined;
    if (dateRange) {
      filter = `segments.date DURING ${dateRange}`;
    }

    const query = this.buildQuery('campaign', fields, filter);
    return this.search(customerId, query);
  }

  /**
   * Get ad group performance report
   */
  async getAdGroupReport(
    customerId: string,
    dateRange?: string,
    metrics?: string[],
    segments?: string[]
  ): Promise<ApiResponse> {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.ctr'
    ];

    const fields = [
      'ad_group.id',
      'ad_group.name',
      'campaign.id',
      'campaign.name',
      ...metrics || defaultMetrics
    ];

    if (segments) {
      fields.push(...segments);
    }

    let filter = undefined;
    if (dateRange) {
      filter = `segments.date DURING ${dateRange}`;
    }

    const query = this.buildQuery('ad_group', fields, filter);
    return this.search(customerId, query);
  }

  /**
   * Get keyword performance report
   */
  async getKeywordReport(
    customerId: string,
    dateRange?: string,
    metrics?: string[]
  ): Promise<ApiResponse> {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.ctr',
      'metrics.average_cpc'
    ];

    const fields = [
      'ad_group_criterion.criterion_id',
      'ad_group_criterion.keyword.text',
      'ad_group_criterion.keyword.match_type',
      'ad_group.name',
      'campaign.name',
      ...metrics || defaultMetrics
    ];

    let filter = `ad_group_criterion.type = 'KEYWORD'`;
    if (dateRange) {
      filter += ` AND segments.date DURING ${dateRange}`;
    }

    const query = this.buildQuery('ad_group_criterion', fields, filter);
    return this.search(customerId, query);
  }

  /**
   * Get search terms report
   */
  async getSearchTermsReport(
    customerId: string,
    dateRange?: string,
    limit?: number
  ): Promise<ApiResponse> {
    const fields = [
      'search_term_view.search_term',
      'search_term_view.status',
      'ad_group.id',
      'ad_group.name',
      'campaign.id',
      'campaign.name',
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.ctr'
    ];

    let filter = undefined;
    if (dateRange) {
      filter = `segments.date DURING ${dateRange}`;
    }

    const query = this.buildQuery('search_term_view', fields, filter, 'metrics.impressions DESC', limit);
    return this.search(customerId, query);
  }

  // ==================== MUTATE METHOD ====================

  /**
   * Execute mutate operations (create, update, remove)
   */
  async mutate(customerId: string, request: Partial<MutateRequest>): Promise<ApiResponse> {
    const body = {
      customerId: this.normalizeCustomerId(customerId),
      mutateOperations: request.mutateOperations || [],
      partialFailure: request.partialFailure !== undefined ? request.partialFailure : false,
      validateOnly: request.validateOnly !== undefined ? request.validateOnly : false,
      responseContentType: request.responseContentType || 'MUTABLE_RESOURCE'
    };

    const response = await this.client.post(
      `/customers/${this.normalizeCustomerId(customerId)}/googleAds:mutate`,
      body
    );

    return response.data;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Execute batch mutate operations
   */
  async batchMutate(operations: Array<{ customerId: string; operations: MutateOperation[] }>): Promise<ApiResponse[]> {
    const results: ApiResponse[] = [];

    for (const op of operations) {
      const result = await this.mutate(op.customerId, {
        mutateOperations: op.operations
      });
      results.push(result);
    }

    return results;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Normalize customer ID (remove dashes)
   */
  private normalizeCustomerId(customerId: string): string {
    return customerId.replace(/-/g, '');
  }

  /**
   * Build update mask from object keys
   */
  private buildUpdateMask(updates: Record<string, any>): string {
    const paths = Object.keys(updates).map(key => {
      // Convert camelCase to snake_case
      return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    });
    return paths.join(',');
  }

  /**
   * Convert micros to currency
   */
  static microsToCurrency(micros: number): number {
    return micros / 1000000;
  }

  /**
   * Convert currency to micros
   */
  static currencyToMicros(amount: number): number {
    return Math.round(amount * 1000000);
  }

  /**
   * Build resource name
   */
  static buildResourceName(customerId: string, resourceType: string, resourceId: string): string {
    return `customers/${customerId.replace(/-/g, '')}/${resourceType}/${resourceId}`;
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
    this.baseURL = `https://googleads.googleapis.com/${version}`;
    this.client.defaults.baseURL = this.baseURL;
  }

  /**
   * Pagination helper - fetch all pages
   */
  async *fetchAllPages<T = any>(
    customerId: string,
    query: string,
    pageSize: number = 1000
  ): AsyncGenerator<T[], void, unknown> {
    let pageToken: string | undefined;

    do {
      const body: any = { query, pageSize };
      if (pageToken) {
        body.pageToken = pageToken;
      }

      const response = await this.client.post(
        `/customers/${this.normalizeCustomerId(customerId)}/googleAds:search`,
        body
      );

      const data: ApiResponse<T> = response.data;

      if (data.results && data.results.length > 0) {
        yield data.results;
      }

      pageToken = data.nextPageToken;
    } while (pageToken);
  }

  /**
   * Fetch all results (not recommended for large datasets)
   */
  async fetchAll<T = any>(customerId: string, query: string, pageSize?: number): Promise<T[]> {
    const allResults: T[] = [];

    for await (const page of this.fetchAllPages<T>(customerId, query, pageSize)) {
      allResults.push(...page);
    }

    return allResults;
  }
}

export default GoogleAdsAPI;
