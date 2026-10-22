
export type TaskIdReponse = { id: string }

export interface LlsTemplateValues {
  owner: string
  argoNS: string
  argoInstance: string
  argoProject: string
  name: string,
  safetyModel: string
  vllmUrl: string
  inferenceModel: string
  mcpToolModel: string
  githubRepoUrl: string
  hostType: 'GitHub' | 'GitLab'
  branch: string
  githubServer: string
  repoOwner: string
  repoName: string
  ogxSecretName: string
  platformCredentialsSecretName: string
  secretsAcknowledgment: boolean
  namespace: string,
  imageRegistry: string
  imageOrg: string
  imageName: string
}
