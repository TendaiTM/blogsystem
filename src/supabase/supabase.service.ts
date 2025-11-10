import { Injectable, Scope, Inject } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private clientInstance: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  getClient(): SupabaseClient {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and ANON KEY are required');
    }

    this.clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    // Set the auth token if available in the request
    const authHeader = (this.request.headers as any)['authorization'];
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      this.clientInstance.auth.setSession({ 
        access_token: token, 
        refresh_token: '' 
      });
    }

    return this.clientInstance;
  }
}