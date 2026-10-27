import { beforeAll, describe, expect, it } from '@jest/globals';
import { DeveloperHubClient } from '../API/developer-hub-client';
import { KubeClient } from '../API/k8s-client';
import { LlsTemplateValues } from '../API/types';
import { GitHubClient } from '../API/git-client';

describe('OGX agentic sample template', () => {
  const templateUrl = 'https://github.com/redhat-developer/rhdh-llama-stack-agentic-sample/blob/main/template/template.yaml';
  const namespace = process.env.APP_NAMESPACE || 'rhdh-app';
  const templateName = 'ogx-agentic';

  const appName = `lls-test-${Date.now()}`;
  const llsSecret = 'ogx-secrets';
  const platformSecret = 'platform-credentials';

  const defaultRepo = `https://github.com/${process.env.GITOPS_GIT_ORG}/${appName}`;

  const templateValues: LlsTemplateValues = {
    argoInstance: 'default',
    argoNS: process.env.ARGO_NAMESPACE || 'ai-rhdh',
    argoProject: 'default',
    branch: 'main',
    githubRepoUrl: process.env.GITHUB_REPO_URL || defaultRepo,
    githubServer: 'github.com',
    hostType: 'GitHub',
    imageName: process.env.IMAGE_NAME || 'llstest',
    imageOrg: process.env.IMAGE_ORG || 'rhdh-pai-qe',
    imageRegistry: 'quay.io',
    inferenceModel: process.env.INFERENCE_MODEL || 'vllm/redhataiqwen3-8b-fp8-dynamic',
    ogxSecretName: llsSecret,
    mcpToolModel: process.env.MCP_MODEL || 'vllm/redhataiqwen3-8b-fp8-dynamic',
    name: appName,
    namespace: namespace,
    owner: 'user:default/Guest',
    platformCredentialsSecretName: platformSecret,
    repoName: appName,
    repoOwner: process.env.GITOPS_GIT_ORG || 'rhdh-pai-qe',
    safetyModel: process.env.SAFETY_MODEL || 'ollama/llama-guard3:8b',
    secretsAcknowledgment: true,
    vllmUrl: process.env.VLLM_URL!
  }

  const llsValues = {
    VLLM_API_KEY: process.env.VLLM_API_KEY!
  };
  const platformValues = {
    GITOPS_GIT_TOKEN: process.env.GITOPS_GIT_TOKEN!,
    GITHUB_APP_WEBHOOK_SECRET: process.env.GITHUB_APP_WEBHOOK_SECRET!,
    QUAY_DOCKERCONFIGJSON: process.env.QUAY_DOCKERCONFIGJSON!
  };

  let hubClient: DeveloperHubClient;
  let kubeClient: KubeClient;
  let gitClient: GitHubClient;

  beforeAll(() => {
    hubClient = new DeveloperHubClient(process.env.RHDH_BASE_URL!, process.env.RHDH_TOKEN);
    kubeClient = new KubeClient(process.env.KUBECONFIG);
    gitClient = new GitHubClient(process.env.GITOPS_GIT_TOKEN!);
  });

  it('Load the template if not imported', async () => {
    let templates = await hubClient.getTemplates();

    const llsTemplate = templates.find((value) => {
      return value.metadata.name === templateName
    });
    if (!llsTemplate) {
      await hubClient.registerTemplate(templateUrl);
    }
  });

  it('Create necessary secrets', async () => {
    await kubeClient.createNamespace(namespace);
    await kubeClient.createSecret(llsSecret, namespace, llsValues);
    await kubeClient.createSecret(platformSecret, namespace, platformValues);
  });

  it('Template runs', async () => {
    const templateOptions = hubClient.createTemplateOptions(templateName, templateValues);
    const task = await hubClient.createComponentTask(templateOptions);
    await hubClient.waitForTask(task.id);
  });

  it('Creates source and gitops repos', async () => {
    const srcExists = await gitClient.checkRepositoryExists(templateValues.repoOwner, templateValues.repoName);
    const gitopsExists = await gitClient.checkRepositoryExists(templateValues.repoOwner, `${templateValues.repoName}-gitops`);

    expect(srcExists).toBe(true);
    expect(gitopsExists).toBe(true);
  });

  it('Creates and merges a pull request in source repo', async () => {
    await gitClient.waitPullMerged(templateValues.repoOwner, templateValues.repoName, 1);
  });

  it('Gitops applications are created', async () => {
    const apps = await kubeClient.applicationExists(`${templateValues.name}-app-of-apps`, templateValues.argoNS);
    const app = await kubeClient.applicationExists(`${templateValues.name}-app`, templateValues.argoNS);

    expect(apps).toBe(true);
    expect(app).toBe(true);
  });

  it('Build pipeline finishes green', async () => {
    const run = await kubeClient.getPipelineRunByRepository(templateValues.repoName, 'push');
    await kubeClient.waitPipelineRunToFinish(run, namespace, 60*60*1000);
  }, 60*60*1000);
  
  it('Deployments are created', async () => {
    const deployments = await kubeClient.listDeployments(namespace, templateValues.name);
    const names = deployments.flatMap((deployment) => deployment.metadata?.name);

    expect(names).toContain(templateValues.name);
    expect(names).toContain(`${templateValues.name}-ogx`);
    expect(names).toContain(`${templateValues.name}-mcp-server`);
    expect(names).toContain(`${templateValues.name}-ollama`);
  });
});