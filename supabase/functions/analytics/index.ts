import { createHandler } from './handler.ts';

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
const env = (name: string) => Deno.env.get(name) ?? '';
Deno.serve(createHandler({
  enabled: env('ANALYTICS_ENABLED') === 'true' && env('ANALYTICS_PRIVACY_APPROVED') === 'true',
  origins: env('ANALYTICS_ALLOWED_ORIGINS').split(',').map(value => value.trim()).filter(Boolean),
  publishableKey: env('ANALYTICS_PUBLISHABLE_KEY'),
  url: env('SUPABASE_URL'), secret: env('SUPABASE_SERVICE_ROLE_KEY'),
}));
