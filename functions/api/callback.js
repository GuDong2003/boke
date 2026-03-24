function renderBody(status, content) {
  const payload = JSON.stringify(content);
  const html = `<!DOCTYPE html>
<html lang="en">
  <body>
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          'authorization:github:${status}:${payload}',
          message.origin
        );
        window.removeEventListener('message', receiveMessage, false);
      };
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    </script>
  </body>
</html>`;

  return html;
}

function readCookie(cookieHeader, name) {
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = entry.trim().split('=');
    if (rawKey === name) {
      return rawValue.join('=');
    }
  }

  return null;
}

function htmlResponse(status, content, responseStatus) {
  return new Response(renderBody(status, content), {
    status: responseStatus,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'Set-Cookie':
        'decap_cms_oauth_state=; Path=/api/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Missing GitHub OAuth environment variables', {
      status: 500,
    });
  }

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expectedState = readCookie(
      request.headers.get('cookie'),
      'decap_cms_oauth_state',
    );

    if (!code) {
      return htmlResponse(
        'error',
        { error: 'missing_code', error_description: 'Missing OAuth code.' },
        400,
      );
    }

    if (!state || !expectedState || state !== expectedState) {
      return htmlResponse(
        'error',
        { error: 'invalid_state', error_description: 'OAuth state mismatch.' },
        401,
      );
    }

    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
          'user-agent': 'gudong-boke-decap-cms',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${url.origin}/api/callback`,
        }).toString(),
      },
    );

    const result = await tokenResponse.json();

    if (!tokenResponse.ok || result.error || !result.access_token) {
      return htmlResponse('error', result, 401);
    }

    return htmlResponse(
      'success',
      { token: result.access_token, provider: 'github' },
      200,
    );
  } catch (error) {
    return htmlResponse(
      'error',
      { error: 'server_error', error_description: error.message },
      500,
    );
  }
}
