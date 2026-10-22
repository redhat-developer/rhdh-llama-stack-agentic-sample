import { ScaffolderScaffoldOptions, ScaffolderTask,TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as https from 'https';
import { LlsTemplateValues, TaskIdReponse } from './types';

export class DeveloperHubClient {
  private readonly RHDHUrl: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(developerHubUrl: string, token?: string) {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    this.RHDHUrl = developerHubUrl;
    this.axiosInstance = axios.create({
      httpAgent: new https.Agent({
        rejectUnauthorized: false
      }),
    });
  }

  async registerTemplate(url: string) {
    const response = await this.axiosInstance.post(`${this.RHDHUrl}/api/catalog/locations`, {
      type: 'url',
      target: `${url}`
    });
    return response.data;
  }

  async getTemplates(): Promise<TemplateEntityV1beta3[]> {
    try {
      const response: AxiosResponse<TemplateEntityV1beta3[]> = await this.axiosInstance.get(`${this.RHDHUrl}/api/catalog/entities?filter=kind=template`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to retrieve templates: ${error}`);
    }
  }

  async createComponentTask(componentCreateOptions: ScaffolderScaffoldOptions): Promise<TaskIdReponse> {
    try {
      const response: AxiosResponse<TaskIdReponse> = await this.axiosInstance.post(`${this.RHDHUrl}/api/scaffolder/v2/tasks`, componentCreateOptions);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to create component: ${error}`);
    }
  }

  async waitForTask(taskId: string, retries = 10): Promise<ScaffolderTask> {
    const delayMs = 5 * 1000;
    let retried = 0;

    while (retried < retries) {
      try {
        const response: AxiosResponse<ScaffolderTask> = await this.axiosInstance.get(`${this.RHDHUrl}/api/scaffolder/v2/tasks/${taskId}`);
        if (response.data.status === 'failed' || response.data.status === 'cancelled') {
          throw new Error(`Task ${taskId} ${response.data.status}`);
        }
        if (response.data.status === 'completed') {
          return response.data;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        retried++;
      } catch (error) {
        console.error(error);
        throw new Error(`Error retrieving task ${taskId}. ${error}`);
      }
    }
    throw new Error(`Task ${taskId} timed out`);
  }

  createTemplateOptions(templateName: string, options: LlsTemplateValues): ScaffolderScaffoldOptions {
    const taskOptions: ScaffolderScaffoldOptions = {
      templateRef: `template:default/${templateName}`,
      values: {
        owner: options.owner,
        argoNS: options.argoNS,
        argoInstance: options.argoInstance,
        argoProject: options.argoProject,
        name: options.name,
        safetyModel: options.safetyModel,
        vllmUrl: options.vllmUrl,
        inferenceModel: options.inferenceModel,
        mcpToolModel: options.mcpToolModel,
        githubRepoUrl: options.githubRepoUrl,
        hostType: options.hostType,
        branch: options.branch,
        githubServer: options.githubServer,
        repoOwner: options.repoOwner,
        repoName: options.repoName,
        ogxSecretName: options.ogxSecretName,
        platformCredentialsSecretName: options.platformCredentialsSecretName,
        secretsAcknowledgment: options.secretsAcknowledgment,
        namespace: options.namespace,
        imageRegistry: options.imageRegistry,
        imageOrg: options.imageOrg,
        imageName: options.imageName
      }
    }

    return taskOptions;
  }
}