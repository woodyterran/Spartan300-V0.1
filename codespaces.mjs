// Use the environment supplied by Codespaces, never an incoming Host header.
export function codespacesOrigin(env = process.env) {
  if (env.CODESPACES !== 'true') return null;
  const name = env.CODESPACE_NAME;
  const domain = env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name || '') ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(domain || '')) {
    throw new Error('Codespaces 环境缺少有效的名称或端口转发域名');
  }
  return `https://${name}-3000.${domain}`;
}
