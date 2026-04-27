import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  platform: string;
  isHealthy: boolean;
  responseTime: number;
  httpStatus?: number;
  errorMessage?: string;
}

interface CircuitBreakerState {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'circuit_open';
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureAt?: string;
}

async function checkPlatformHealth(platform: string, healthCheckEndpoint: string): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(healthCheckEndpoint, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      platform,
      isHealthy: response.ok || response.status === 405,
      responseTime,
      httpStatus: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      platform,
      isHealthy: false,
      responseTime,
      errorMessage: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}

async function updateCircuitBreaker(
  supabase: any,
  platform: string,
  isHealthy: boolean,
  responseTime: number,
  httpStatus?: number,
  errorMessage?: string
): Promise<CircuitBreakerState> {
  const { data: currentStatus, error: fetchError } = await supabase
    .from('platform_health_status')
    .select('*')
    .eq('platform', platform)
    .single();

  if (fetchError || !currentStatus) {
    console.error(`Failed to fetch status for ${platform}:`, fetchError);
    return { status: 'unhealthy', consecutiveFailures: 1, consecutiveSuccesses: 0 };
  }

  const previousStatus = currentStatus.status;
  let newStatus = previousStatus;
  let consecutiveFailures = currentStatus.consecutive_failures || 0;
  let consecutiveSuccesses = currentStatus.consecutive_successes || 0;
  const failureThreshold = currentStatus.failure_threshold || 5;
  const successThreshold = currentStatus.success_threshold || 2;
  const recoveryTimeout = currentStatus.recovery_timeout || 300;

  if (isHealthy) {
    consecutiveSuccesses++;
    consecutiveFailures = 0;

    if (previousStatus === 'circuit_open') {
      const lastFailure = currentStatus.last_failure_at ? new Date(currentStatus.last_failure_at) : null;
      const now = new Date();
      if (lastFailure && (now.getTime() - lastFailure.getTime()) / 1000 >= recoveryTimeout) {
        if (consecutiveSuccesses >= successThreshold) {
          newStatus = 'healthy';
          consecutiveSuccesses = 0;
        } else {
          newStatus = 'degraded';
        }
      }
    } else if (previousStatus === 'degraded' && consecutiveSuccesses >= successThreshold) {
      newStatus = 'healthy';
      consecutiveSuccesses = 0;
    } else if (previousStatus === 'unhealthy' && consecutiveSuccesses >= successThreshold) {
      newStatus = 'degraded';
    }
  } else {
    consecutiveFailures++;
    consecutiveSuccesses = 0;

    if (previousStatus === 'healthy' && consecutiveFailures >= failureThreshold) {
      newStatus = 'circuit_open';
    } else if (previousStatus === 'healthy') {
      newStatus = 'degraded';
    } else if (previousStatus === 'degraded' && consecutiveFailures >= failureThreshold) {
      newStatus = 'unhealthy';
    }
  }

  const statusChanged = previousStatus !== newStatus;
  const totalRequests = (currentStatus.total_requests || 0) + 1;
  const totalFailures = isHealthy ? (currentStatus.total_failures || 0) : (currentStatus.total_failures || 0) + 1;
  const avgResponseTime = currentStatus.avg_response_time
    ? Math.round((currentStatus.avg_response_time * (totalRequests - 1) + responseTime) / totalRequests)
    : responseTime;

  const updateData: any = {
    status: newStatus,
    consecutive_failures: consecutiveFailures,
    consecutive_successes: consecutiveSuccesses,
    total_requests: totalRequests,
    total_failures: totalFailures,
    avg_response_time: avgResponseTime,
    last_check_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isHealthy) {
    updateData.last_success_at = new Date().toISOString();
  } else {
    updateData.last_failure_at = new Date().toISOString();
  }

  await supabase
    .from('platform_health_status')
    .update(updateData)
    .eq('platform', platform);

  await supabase.from('platform_health_logs').insert({
    platform,
    check_type: 'scheduled',
    is_healthy: isHealthy,
    response_time: responseTime,
    http_status: httpStatus,
    error_message: errorMessage,
    previous_status: previousStatus,
    current_status: newStatus,
    status_changed: statusChanged,
    checked_at: new Date().toISOString(),
  });

  return {
    status: newStatus,
    consecutiveFailures,
    consecutiveSuccesses,
  };
}

async function processRetryQueue(supabase: any) {
  const now = new Date().toISOString();

  const { data: pendingTasks, error: fetchError } = await supabase
    .from('publish_task_queue')
    .select('*')
    .in('status', ['pending', 'retrying'])
    .lte('next_retry_at', now)
    .order('priority', { ascending: true })
    .limit(10);

  if (fetchError || !pendingTasks || pendingTasks.length === 0) {
    return;
  }

  for (const task of pendingTasks) {
    const { data: healthStatus } = await supabase
      .from('platform_health_status')
      .select('status')
      .eq('platform', task.platform)
      .single();

    if (healthStatus && healthStatus.status === 'healthy') {
      await supabase
        .from('publish_task_queue')
        .update({
          status: 'processing',
          executed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      console.log(`Task ${task.id} ready for retry to ${task.platform}`);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith('/check-all')) {
      const { data: platforms, error: platformsError } = await supabase
        .from('platform_health_status')
        .select('*')
        .eq('is_active', true);

      if (platformsError) {
        throw new Error('Failed to fetch platforms');
      }

      const results: HealthCheckResult[] = [];

      for (const platform of platforms || []) {
        if (!platform.health_check_endpoint) {
          continue;
        }

        const result = await checkPlatformHealth(platform.platform, platform.health_check_endpoint);
        await updateCircuitBreaker(
          supabase,
          platform.platform,
          result.isHealthy,
          result.responseTime,
          result.httpStatus,
          result.errorMessage
        );
        results.push(result);
      }

      await processRetryQueue(supabase);

      return new Response(
        JSON.stringify({
          success: true,
          checked: results.length,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.endsWith('/check')) {
      const { platform } = await req.json();

      if (!platform) {
        return new Response(
          JSON.stringify({ error: 'Platform is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: platformData, error: platformError } = await supabase
        .from('platform_health_status')
        .select('*')
        .eq('platform', platform)
        .single();

      if (platformError || !platformData) {
        return new Response(
          JSON.stringify({ error: 'Platform not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await checkPlatformHealth(platform, platformData.health_check_endpoint);
      const circuitState = await updateCircuitBreaker(
        supabase,
        platform,
        result.isHealthy,
        result.responseTime,
        result.httpStatus,
        result.errorMessage
      );

      return new Response(
        JSON.stringify({
          success: true,
          result,
          circuitState,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.endsWith('/status')) {
      const { data: platforms, error } = await supabase
        .from('platform_health_status')
        .select('*')
        .order('priority', { ascending: true });

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          platforms,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
